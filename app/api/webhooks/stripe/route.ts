import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Log every webhook event to email_logs for audit trail.
// Security: never log PII sourced from Stripe (customer email, name, etc).
async function logWebhookEvent(
  supabase: ReturnType<typeof adminSupabase>,
  eventType: string,
  userId: string | null,
  status: 'processed' | 'skipped' | 'error',
  detail?: string
) {
  try {
    await supabase.from('email_logs').insert({
      user_id: userId,
      to_email: 'webhook@internal',
      from_email: 'stripe@webhook',
      subject: `[Webhook] ${eventType}${detail ? ' — ' + detail : ''}`,
      email_type: 'webhook_stripe',
      status,
    });
  } catch (err) {
    console.error('[webhook] Failed to log event:', err);
  }
}

// The ONLY profile fields this webhook is ever permitted to write.
// If this set changes, it must be reviewed explicitly.
const ALLOWED_PROFILE_FIELDS = new Set(['subscription_tier']);

function safeProfileUpdate(fields: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (ALLOWED_PROFILE_FIELDS.has(k)) safe[k] = v;
    else console.error(`[webhook] Blocked attempt to write disallowed profile field: ${k}`);
  }
  return safe;
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
        const { listing_id, user_id, weeks } = metadata;
        if (!listing_id || !user_id || !weeks) {
          console.error('listing_boost: missing metadata', metadata);
          await logWebhookEvent(supabase, event.type, user_id ?? null, 'error', 'missing listing_boost metadata');
          break;
        }

        const weeksNum = parseInt(weeks, 10);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + weeksNum * 7 * 24 * 60 * 60 * 1000);

        const { error: boostErr } = await supabase
          .from('listing_boosts')
          .update({
            status: 'active',
            boost_starts_at: now,
            boost_expires_at: expiresAt,
            stripe_payment_intent_id: (session.payment_intent as string) ?? null,
            updated_at: now,
          })
          .eq('stripe_session_id', session.id);

        if (boostErr) console.error('Failed to activate boost:', boostErr);

        const { error: listingErr } = await supabase
          .from('listings')
          .update({ promoted: true, boost_expires_at: expiresAt })
          .eq('id', listing_id);

        if (listingErr) console.error('Failed to promote listing:', listingErr);

        await logWebhookEvent(
          supabase, event.type, user_id,
          boostErr || listingErr ? 'error' : 'processed',
          `listing_boost listing=${listing_id}`
        );
        break;
      }

      // --- Subscription checkout ---
      // Security: only update subscription_tier when Stripe confirms payment is collected.
      // NEVER read or write email, name, or any personal info from/to Stripe data.
      if (session.payment_status !== 'paid') {
        console.warn('checkout.session.completed: payment_status is not paid — skipping', {
          payment_status: session.payment_status,
          session_id: session.id,
        });
        await logWebhookEvent(supabase, event.type, session.client_reference_id, 'skipped', `payment_status=${session.payment_status}`);
        break;
      }

      const userId = session.client_reference_id;
      const tier = metadata.tier;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!userId || !tier) {
        console.error('checkout.session.completed: missing userId or tier', { userId, tier });
        await logWebhookEvent(supabase, event.type, userId, 'error', 'missing userId or tier');
        break;
      }

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

      // Security: use .update() (not .upsert()) so we never insert a profile row from here.
      // Only subscription_tier is written — safeProfileUpdate enforces this.
      const { error: profileTierError } = await supabase
        .from('profiles')
        .update(safeProfileUpdate({ subscription_tier: tier }))
        .eq('id', userId);

      if (profileTierError) console.error('Failed to sync tier to profiles on checkout:', profileTierError);

      await logWebhookEvent(
        supabase, event.type, userId,
        subError || profileTierError ? 'error' : 'processed',
        `tier=${tier}`
      );
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      const { data: subRow, error: lookupError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

      if (lookupError || !subRow) {
        console.error('subscription.updated: could not find user for customer', { stripeCustomerId });
        await logWebhookEvent(supabase, event.type, null, 'error', 'user not found for stripe_customer_id');
        break;
      }

      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const priceToTier: Record<string, string> = {
        [process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID!]: 'standard',
        [process.env.STRIPE_STANDARD_ANNUAL_PRICE_ID!]: 'standard',
        [process.env.STRIPE_PRIORITY_MONTHLY_PRICE_ID!]: 'priority',
        [process.env.STRIPE_PRIORITY_ANNUAL_PRICE_ID!]: 'priority',
        [process.env.STRIPE_EXCLUSIVE_MONTHLY_PRICE_ID!]: 'exclusive',
        [process.env.STRIPE_EXCLUSIVE_ANNUAL_PRICE_ID!]: 'exclusive',
      };
      const newTier = priceId ? priceToTier[priceId] : undefined;

      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          stripe_price_id: priceId,
          ...(newTier ? { tier: newTier } : {}),
          current_period_start: new Date((subscription as any).current_period_start * 1000),
          current_period_end: new Date((subscription as any).current_period_end * 1000),
          updated_at: new Date(),
        })
        .eq('user_id', subRow.user_id);

      if (subUpdateError) console.error('Failed to update subscription on subscription.updated:', subUpdateError);

      // Security: use .update() and only touch subscription_tier.
      if (newTier) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update(safeProfileUpdate({ subscription_tier: newTier }))
          .eq('id', subRow.user_id);
        if (profileErr) console.error('Failed to sync tier to profiles on subscription.updated:', profileErr);
      }

      await logWebhookEvent(
        supabase, event.type, subRow.user_id,
        subUpdateError ? 'error' : 'processed',
        `status=${subscription.status}${newTier ? ` tier=${newTier}` : ''}`
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      const { data: subRow, error: lookupError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

      if (lookupError || !subRow) {
        console.error('subscription.deleted: could not find user for customer', { stripeCustomerId });
        await logWebhookEvent(supabase, event.type, null, 'error', 'user not found for stripe_customer_id');
        break;
      }

      const { error: subDeleteError } = await supabase
        .from('subscriptions')
        .update({
          tier: 'standard',
          status: 'canceled',
          cancelled_at: new Date(),
          updated_at: new Date(),
        })
        .eq('user_id', subRow.user_id);

      if (subDeleteError) console.error('Failed to downgrade tier on subscription deletion:', subDeleteError);

      // Security: use .update() and only touch subscription_tier.
      const { error: profileDowngradeError } = await supabase
        .from('profiles')
        .update(safeProfileUpdate({ subscription_tier: 'standard' }))
        .eq('id', subRow.user_id);

      if (profileDowngradeError) console.error('Failed to sync tier downgrade to profiles:', profileDowngradeError);

      await logWebhookEvent(
        supabase, event.type, subRow.user_id,
        subDeleteError || profileDowngradeError ? 'error' : 'processed',
        'subscription canceled, tier reset to standard'
      );
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = invoice.customer as string;

      // Security: log invoice ID and amount only — never log customer email from Stripe.
      console.error('invoice.payment_failed', {
        invoiceId: invoice.id,
        customerId: stripeCustomerId,
        amountDue: invoice.amount_due,
        attemptCount: invoice.attempt_count,
      });

      if (stripeCustomerId) {
        const { data: subRow } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date() })
          .eq('stripe_customer_id', stripeCustomerId);

        if (error) console.error('Failed to mark past_due on payment failure:', error);

        await logWebhookEvent(
          supabase, event.type, subRow?.user_id ?? null,
          error ? 'error' : 'processed',
          `invoice=${invoice.id}`
        );
      }
      break;
    }

    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`);
      break;
  }

  return NextResponse.json({ received: true });
}
