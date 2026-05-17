import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'newest';
  const search = (searchParams.get('search') || '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

  const orderCol =
    sort === 'price_desc' || sort === 'price_asc' ? 'asking_price'
    : sort === 'acres_desc' || sort === 'acres_asc' ? 'lot_size_acres'
    : 'created_at'; // recommended + newest both sort by created_at (promoted float to top client-side)
  const ascending = sort === 'price_asc' || sort === 'acres_asc';

  const supabase = createServiceClient();

  let query = supabase
    .from('listings')
    .select(
      'id,title,property_description,state,county,zip_code,street_address,apn,' +
      'lot_size_acres,lot_size_sqft,zoning,road_access,utilities,asking_price,' +
      'price_negotiable,ownership_type,contact_methods,status,photos_urls,' +
      'owner_name,digital_signature,created_at,user_id,promoted,boost_expires_at,lat,lng'
    )
    .in('status', ['active', 'published'])
    .order(orderCol, { ascending })
    .limit(limit);

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,state.ilike.%${search}%,county.ilike.%${search}%,zip_code.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  try {
    // Parse body with a clear error if malformed
    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    console.log('[POST /api/listings] received body keys:', Object.keys(body));

    // Verify authenticated user via cookie-based server client
    const serverClient = await createClient();
    const { data: { user }, error: authError } = await serverClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      ownershipType,
      ownershipCertified,
      title,
      propertyDescription,
      state,
      county,
      zipCode,
      streetAddress,
      apn,
      lotSizeValue,
      lotSizeUnit,
      zoning,
      roadAccess,
      utilities,
      askingPrice,
      comparableMarketValue,
      priceNegotiable,
      preferredCloseDate,
      additionalInformation,
      contactMethods,
      photosUrls,
      contractUrl,
      legalConfirmation,
      platformUnderstanding,
      stateCompliance,
      digitalSignature,
      signatureDate,
    } = body;

    const lotSizeAcres = lotSizeUnit === 'acres' && lotSizeValue ? Number(lotSizeValue) : null;
    const lotSizeSqft  = lotSizeUnit === 'sqft'  && lotSizeValue ? Number(lotSizeValue) : null;

    const payload = {
      user_id:                 user.id,
      status:                  'pending_review',
      ownership_type:          ownershipType          ?? null,
      ownership_certified:     ownershipCertified     ?? false,
      title:                   title                  ?? null,
      property_description:    propertyDescription    ?? null,
      state:                   state                  ?? null,
      county:                  county                 ?? null,
      zip_code:                zipCode                ?? null,
      street_address:          streetAddress          ?? null,
      apn:                     apn                    ?? null,
      lot_size_acres:          lotSizeAcres,
      lot_size_sqft:           lotSizeSqft,
      zoning:                  zoning                 ?? null,
      road_access:             roadAccess             ?? [],
      utilities:               utilities              ?? [],
      asking_price:            askingPrice            ? Number(askingPrice)            : null,
      comparable_market_value: comparableMarketValue  ? Number(comparableMarketValue)  : null,
      price_negotiable:        priceNegotiable        ?? false,
      preferred_close_date:    preferredCloseDate     ?? null,
      additional_information:  additionalInformation  ?? null,
      contact_methods:         contactMethods         ?? [],
      photos_urls:             photosUrls             ?? [],
      contract_url:            contractUrl            ?? null,
      legal_confirmation:      legalConfirmation      ?? false,
      platform_understanding:  platformUnderstanding  ?? false,
      state_compliance:        stateCompliance        ?? false,
      digital_signature:       digitalSignature       ?? null,
      signature_date:          signatureDate          ?? null,
    };

    console.log('[POST /api/listings] inserting for user', user.id);

    const serviceClient = createServiceClient();
    const { data: listing, error: insertError } = await serviceClient
      .from('listings')
      .insert(payload)
      .select('id')
      .single();

    if (insertError) {
      console.error('[POST /api/listings] insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('[POST /api/listings] created listing', listing.id);
    return NextResponse.json({ id: listing.id }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/listings] unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
