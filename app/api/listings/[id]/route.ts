import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { findProfaneField, profanityError } from '@/lib/profanity-validation';
import { normalizeAskingPrice } from '@/lib/listing-price';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from('listings')
    .select('id,user_id')
    .eq('id', id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const profanityFields = [
    { label: 'title', value: body.title },
    { label: 'property description', value: body.property_description },
    { label: 'city', value: body.city },
    { label: 'state', value: body.state },
    { label: 'county', value: body.county },
    { label: 'street address', value: body.street_address },
    { label: 'APN', value: body.apn },
    { label: 'zoning', value: body.zoning },
    { label: 'additional information', value: body.additional_information },
  ];
  const profaneField = findProfaneField(profanityFields);
  if (profaneField) return NextResponse.json({ error: profanityError(profaneField) }, { status: 400 });

  const update = {
    title: nullableText(body.title),
    property_description: nullableText(body.property_description),
    city: nullableText(body.city),
    state: nullableText(body.state),
    county: nullableText(body.county),
    zip_code: nullableText(body.zip_code),
    street_address: nullableText(body.street_address),
    apn: nullableText(body.apn),
    lot_size_acres: nullableNumber(body.lot_size_acres),
    lot_size_sqft: nullableNumber(body.lot_size_sqft),
    zoning: nullableText(body.zoning),
    road_access: Array.isArray(body.road_access) ? body.road_access.filter(v => typeof v === 'string') : [],
    utilities: Array.isArray(body.utilities) ? body.utilities.filter(v => typeof v === 'string') : [],
    asking_price: normalizeAskingPrice(body.asking_price, body.lot_size_acres),
    comparable_market_value: nullableNumber(body.comparable_market_value),
    price_negotiable: Boolean(body.price_negotiable),
    preferred_close_date: nullableText(body.preferred_close_date),
    additional_information: nullableText(body.additional_information),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('listings')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
