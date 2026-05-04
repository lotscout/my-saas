import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = adminSupabase();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};

      // --- Listing Boost payment ---
      if (metadata.type === 'listing_boost') {
        const { listing_id, user_id, weeks, weekly_rate_cents } = metadata;
        if (!listing_id || !user_id || !weeks) {
          console.error('listing_boost: missing metadata', metadata);
          break;
        }

        const weeksNum = parseInt(weeks, 10);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + weeksNum * 7 * 24 * 60 * 60 * 1000);

        // Activate boost record
        const { error: boostErr } = await supabase
          .from('listing_boosts')
          .update({
            status: 'active',
            boost_starts_at: now,
            boost_expires_at: expiresAt,
            stripe_payment_intent_id: session.payment_intent as string ?? null,
            updated_at: now,
          })
          .eq('stripe_session_id', session.id);

        if (boostErr) console.error('Failed to activate boost:', boostErr);

        // Mark listing as promoted
        const { error: listingErr } = await supabase
          .from('listings')
          .update({ promoted: true, boost_expires_at: expiresAt })
          .eq('id', listing_id);

        if (listingErr) console.error('Failed to promote listing:', listingErr);
        break;
      }

      // --- Subscription checkout ---
      const userId = session.client_reference_id;
      const tier = metadata.tier;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!userId || !tier) {
        console.error('checkout.session.completed: missing userId or tier', { userId, tier });
        break;
      }

      // Fetch subscription details from Stripe for period dates
      let periodStart: Date | null = null;
      let periodEnd: Date | null = null;
      let stripePriceId: string | null = null;

      if (stripeSubscriptionId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          const subAny = stripeSub as any;
          periodStart = new Date(subAny.current_period_start * 1000);
          periodEnd = new Date(subAny.current_period_end * 1000);
          stripePriceId = stripeSub.items.data[0]?.price?.id ?? null;
        } catch (e) {
          console.error('Failed to retrieve Stripe subscription:', e);
        }
      }

      // Upsert into subscriptions table
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_price_id: stripePriceId,
          tier,
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          updated_at: new Date(),
        }, { onConflict: 'user_id' });

      if (subError) console.error('Failed to upsert subscription on checkout:', subError);

      // Sync tier to profiles table
      const { error: profileTierError } = await supabase
        .from('profiles')
        .upsert({ id: userId, tier }, { onConflict: 'id' });

      if (profileTierError) console.error('Failed to sync tier to profiles on checkout:', profileTierError);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      // Look up user by stripe_customer_id
      const { data: subRow, error: lookupError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

      if (lookupError || !subRow) {
        console.error('subscription.updated: could not find user for customer', { stripeCustomerId });
        break;
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date((subscription as any).current_period_start * 1000),
          current_period_end: new Date((subscription as any).current_period_end * 1000),
          updated_at: new Date(),
        })
        .eq('user_id', subRow.user_id);

      if (error) console.error('Failed to update subscription on subscription.updated:', error);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      // Look up user by stripe_customer_id — never use email for this
      const { data: subRow, error: lookupError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

      if (lookupError || !subRow) {
        console.error('subscription.deleted: could not find user for customer', { stripeCustomerId });
        break;
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({
          tier: 'standard',
          status: 'canceled',
          cancelled_at: new Date(),
          updated_at: new Date(),
        })
        .eq('user_id', subRow.user_id);

      if (error) console.error('Failed to downgrade tier on subscription deletion:', error);

      // Sync downgrade to profiles table
      const { error: profileDowngradeError } = await supabase
        .from('profiles')
        .update({ tier: 'standard' })
        .eq('id', subRow.user_id);

      if (profileDowngradeError) console.error('Failed to sync tier downgrade to profiles:', profileDowngradeError);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = invoice.customer as string;

      console.error('invoice.payment_failed', {
        invoiceId: invoice.id,
        customerId: stripeCustomerId,
        customerEmail: invoice.customer_email,
        amountDue: invoice.amount_due,
        attemptCount: invoice.attempt_count,
      });

      // Mark subscription as past_due
      if (stripeCustomerId) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date() })
          .eq('stripe_customer_id', stripeCustomerId);

        if (error) console.error('Failed to mark past_due on payment failure:', error);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
