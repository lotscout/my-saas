import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Weekly rates in cents
const WEEKLY_RATES: Record<string, number> = {
  standard: 2900,   // $29.00
  priority: 2900,   // $29.00
  exclusive: 290,   // $2.90 (90% off)
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { listingId, budgetCents } = await request.json();

    if (!listingId || !budgetCents || budgetCents < 100) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Verify listing belongs to user
    const service = createServiceClient();
    const { data: listing, error: listingError } = await service
      .from('listings')
      .select('id, title, user_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user tier. Boosts are a paid-tier add-on, so do not allow free/unsubscribed users.
    const { data: subscription } = await service
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const { data: profile } = await service
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = subscription?.tier || profile?.subscription_tier || null;
    if (!tier || !(tier in WEEKLY_RATES)) {
      return NextResponse.json({ error: 'A paid LotScout plan is required to boost listings' }, { status: 403 });
    }

    const weeklyRate = WEEKLY_RATES[tier];
    const weeks = Math.max(1, Math.floor(budgetCents / weeklyRate));
    const totalCents = weeks * weeklyRate;

    // Create Stripe checkout session (one-time payment)
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Promoted Listing Boost — ${weeks} week${weeks > 1 ? 's' : ''}`,
            description: `Feature "${listing.title || 'your listing'}" at the top of search results`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      client_reference_id: user.id,
      metadata: {
        type: 'listing_boost',
        listing_id: listingId,
        user_id: user.id,
        tier,
        budget_cents: budgetCents.toString(),
        weeks: weeks.toString(),
        weekly_rate_cents: weeklyRate.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace?boost=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace`,
    });

    // Pre-create boost record in pending state
    await service.from('listing_boosts').insert({
      listing_id: listingId,
      user_id: user.id,
      tier,
      budget_cents: totalCents,
      weeks,
      weekly_rate_cents: weeklyRate,
      stripe_session_id: session.id,
      status: 'pending',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Boost checkout error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
