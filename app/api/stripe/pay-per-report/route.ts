import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: 2900,
          product_data: { name: 'Property Analysis Report — LotScout' },
        },
        quantity: 1,
      },
    ],
    client_reference_id: user.id,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/property-analysis?paid_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/property-analysis`,
  });

  return NextResponse.json({ url: session.url });
}
