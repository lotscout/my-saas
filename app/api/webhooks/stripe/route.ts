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
      const userId = session.client_reference_id;
      const tier = session.metadata?.tier;

      if (!userId || !tier) {
        console.error('checkout.session.completed: missing userId or tier', { userId, tier });
        break;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ tier })
        .eq('id', userId);

      if (error) console.error('Failed to update tier on checkout:', error);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted || !('email' in customer) || !customer.email) {
        console.error('subscription.deleted: could not resolve customer email', { customerId });
        break;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ tier: 'standard' })
        .eq('email', customer.email);

      if (error) console.error('Failed to downgrade tier on subscription deletion:', error);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.error('invoice.payment_failed', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        customerEmail: invoice.customer_email,
        amountDue: invoice.amount_due,
        attemptCount: invoice.attempt_count,
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
