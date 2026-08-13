import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { findProfaneField, profanityError } from '@/lib/profanity-validation';
import { normalizeAskingPrice } from '@/lib/listing-price';

// Build a stored seller name as first name + last initial (e.g. "Marcus T.").
function formatOwnerName(first: string | null, last: string | null): string | null {
  const f = (first ?? '').trim();
  const l = (last ?? '').trim();
  if (!f && !l) return null;
  if (!l) return f;
  return `${f} ${l[0].toUpperCase()}.`;
}

export async function GET(request: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'newest';
  const search = (searchParams.get('search') || '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);
  const mine = searchParams.get('mine') === 'true';

  const orderCol =
    sort === 'price_desc' || sort === 'price_asc' ? 'asking_price'
    : sort === 'acres_desc' || sort === 'acres_asc' ? 'lot_size_acres'
    : 'created_at'; // recommended + newest both sort by created_at (promoted float to top client-side)
  const ascending = sort === 'price_asc' || sort === 'acres_asc';

  const supabase = createServiceClient();

  let query = supabase
    .from('listings')
    .select(
      'id,title,property_description,city,state,county,zip_code,street_address,apn,' +
      'lot_size_acres,lot_size_sqft,zoning,road_access,utilities,asking_price,' +
      'price_negotiable,ownership_type,contact_methods,status,photos_urls,' +
      'owner_name,digital_signature,created_at,user_id,promoted,boost_expires_at,lat,lng'
    )
    .order(orderCol, { ascending })
    .limit(limit);

  if (mine) {
    query = query.eq('user_id', user.id);
  } else {
    query = query.in('status', ['active', 'published']);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,county.ilike.%${search}%,zip_code.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nowSec = Math.floor(Date.now() / 1000);

  // Strip expired Facebook CDN URLs from photos_urls before sorting/returning.
  // FB CDN URLs contain `oe=<hex unix timestamp>` — if that timestamp is in the past, the image 404s.
  function filterPhotos(urls: string[] | null): string[] {
    if (!Array.isArray(urls)) return [];
    return urls.filter(u => {
      if (!u) return false;
      if (!u.includes('fbcdn') && !u.includes('facebook')) return true; // non-FB URLs always kept
      const m = u.match(/oe=([0-9a-fA-F]+)/);
      if (!m) return true; // no expiry param — keep
      return parseInt(m[1], 16) > nowSec; // keep only if not yet expired
    });
  }

  const cleaned = (data ?? []).map((row: any) => ({
    ...row,
    photos_urls: filterPhotos(row.photos_urls),
  }));

  // Sort: listings with valid images first, no-image listings last
  cleaned.sort((a: any, b: any) => {
    const aHasImg = a.photos_urls.length > 0;
    const bHasImg = b.photos_urls.length > 0;
    if (aHasImg && !bHasImg) return -1;
    if (!aHasImg && bHasImg) return 1;
    return 0;
  });

  return NextResponse.json(cleaned);
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
      city,
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

    const streetAddressClean = typeof streetAddress === 'string' ? streetAddress.trim() : '';
    const apnClean = typeof apn === 'string' ? apn.trim() : '';
    const cityClean = typeof city === 'string' ? city.trim() : '';
    const stateClean = typeof state === 'string' ? state.trim() : '';
    const zipCodeClean = typeof zipCode === 'string' ? zipCode.trim() : '';

    if (!streetAddressClean && !apnClean) {
      return NextResponse.json({ error: 'Enter a street address or APN — at least one is required' }, { status: 400 });
    }
    if (!cityClean) return NextResponse.json({ error: 'City is required' }, { status: 400 });
    if (!stateClean) return NextResponse.json({ error: 'State is required' }, { status: 400 });
    if (!zipCodeClean) return NextResponse.json({ error: 'Zip code is required' }, { status: 400 });

    const profaneField = findProfaneField([
      { label: 'title', value: title },
      { label: 'property description', value: propertyDescription },
      { label: 'city', value: city },
      { label: 'state', value: state },
      { label: 'county', value: county },
      { label: 'street address', value: streetAddress },
      { label: 'APN', value: apn },
      { label: 'zoning', value: zoning },
      { label: 'additional information', value: additionalInformation },
      { label: 'digital signature', value: digitalSignature },
    ]);
    if (profaneField) {
      return NextResponse.json({ error: profanityError(profaneField) }, { status: 400 });
    }

    const rawLotSize = lotSizeValue ? Number(lotSizeValue) : null;
    const lotSizeAcres = rawLotSize && rawLotSize > 0
      ? lotSizeUnit === 'acres'
        ? rawLotSize
        : Number((rawLotSize / 43560).toFixed(6))
      : null;
    const lotSizeSqft = rawLotSize && rawLotSize > 0
      ? lotSizeUnit === 'sqft'
        ? Math.round(rawLotSize)
        : Math.round(rawLotSize * 43560)
      : null;

    const serviceClient = createServiceClient();

    // Populate owner_name from the creating user's profile (first name + last initial)
    // so app-created listings surface a real seller name and a seller profile.
    const { data: creatorProfile } = await serviceClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();
    const ownerName = formatOwnerName(creatorProfile?.first_name ?? null, creatorProfile?.last_name ?? null);

    const normalizedAskingPrice = normalizeAskingPrice(askingPrice, lotSizeAcres);

    const payload = {
      user_id:                 user.id,
      owner_name:              ownerName,
      status:                  'pending_review',
      ownership_type:          ownershipType          ?? null,
      ownership_certified:     ownershipCertified     ?? false,
      title:                   title                  ?? null,
      property_description:    propertyDescription    ?? null,
      city:                    cityClean,
      state:                   stateClean,
      county:                  county                 ?? null,
      zip_code:                zipCodeClean,
      street_address:          streetAddressClean || null,
      apn:                     apnClean || null,
      lot_size_acres:          lotSizeAcres,
      lot_size_sqft:           lotSizeSqft,
      zoning:                  zoning                 ?? null,
      road_access:             roadAccess             ?? [],
      utilities:               utilities              ?? [],
      asking_price:            normalizedAskingPrice,
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
