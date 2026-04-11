import Stripe from 'stripe';

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  console.log('STRIPE_SECRET_KEY present:', !!secretKey);
  if (!secretKey) {
    return Response.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);

  const priceIdMap: Record<string, string | undefined> = {
    standardMonthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID,
    standardAnnual: process.env.STRIPE_STANDARD_ANNUAL_PRICE_ID,
    priorityMonthly: process.env.STRIPE_PRIORITY_MONTHLY_PRICE_ID,
    priorityAnnual: process.env.STRIPE_PRIORITY_ANNUAL_PRICE_ID,
    exclusiveMonthly: process.env.STRIPE_EXCLUSIVE_MONTHLY_PRICE_ID,
    exclusiveAnnual: process.env.STRIPE_EXCLUSIVE_ANNUAL_PRICE_ID,
  };

  const { priceKey } = await request.json();

  const priceId = priceIdMap[priceKey];
  if (!priceId) {
    return Response.json({ error: 'Invalid price key' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/success`,
    cancel_url: `${baseUrl}/pricing`,
  });

  return Response.json({ url: session.url });
}
