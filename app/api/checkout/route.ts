import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function adminSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const priceMap: Record<string, string | undefined> = {
  standardMonthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID,
  standardAnnual: process.env.STRIPE_STANDARD_ANNUAL_PRICE_ID,
  priorityMonthly: process.env.STRIPE_PRIORITY_MONTHLY_PRICE_ID,
  priorityAnnual: process.env.STRIPE_PRIORITY_ANNUAL_PRICE_ID,
  exclusiveMonthly: process.env.STRIPE_EXCLUSIVE_MONTHLY_PRICE_ID,
  exclusiveAnnual: process.env.STRIPE_EXCLUSIVE_ANNUAL_PRICE_ID,
  additionalReport: process.env.STRIPE_ADDITIONAL_REPORT_PRICE_ID,
};

const tierFromPriceKey: Record<string, string | undefined> = {
  standardMonthly: 'standard',
  standardAnnual: 'standard',
  priorityMonthly: 'priority',
  priorityAnnual: 'priority',
  exclusiveMonthly: 'exclusive',
  exclusiveAnnual: 'exclusive',
  additionalReport: undefined,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { priceKey } = await request.json();
    const priceId = priceMap[priceKey];
    const tier = tierFromPriceKey[priceKey];
    const isOneTime = priceKey === 'additionalReport';

    if (!priceId || (!isOneTime && !tier)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Reuse existing Stripe customer if available
    const supabaseAdmin = adminSupabase();
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    const existingCustomerId = existingSub?.stripe_customer_id ?? undefined;

    const session = await stripe.checkout.sessions.create({
      mode: isOneTime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      ...(existingCustomerId ? { customer: existingCustomerId } : {}),
      ...(isOneTime ? {} : { metadata: { tier } }),
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/property-analysis`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/property-analysis`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
