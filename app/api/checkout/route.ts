import { NextRequest, NextResponse } from 'next/server';

const priceMap: Record<string, string | undefined> = {
  standardMonthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID,
  standardAnnual: process.env.STRIPE_STANDARD_ANNUAL_PRICE_ID,
  priorityMonthly: process.env.STRIPE_PRIORITY_MONTHLY_PRICE_ID,
  priorityAnnual: process.env.STRIPE_PRIORITY_ANNUAL_PRICE_ID,
  exclusiveMonthly: process.env.STRIPE_EXCLUSIVE_MONTHLY_PRICE_ID,
  exclusiveAnnual: process.env.STRIPE_EXCLUSIVE_ANNUAL_PRICE_ID,
};

export async function POST(request: NextRequest) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { priceKey } = await request.json();
    const priceId = priceMap[priceKey];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
