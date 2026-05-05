import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'newest';
  const search = (searchParams.get('search') || '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

  const orderCol =
    sort === 'price_desc' || sort === 'price_asc' ? 'asking_price'
    : sort === 'acres_desc' || sort === 'acres_asc' ? 'lot_size_acres'
    : 'created_at';
  const ascending = sort === 'price_asc' || sort === 'acres_asc';

  const supabase = createServiceClient();

  let query = supabase
    .from('listings')
    .select(
      'id,title,property_description,state,county,zip_code,street_address,' +
      'lot_size_acres,lot_size_sqft,zoning,road_access,utilities,asking_price,' +
      'price_negotiable,ownership_type,contact_methods,status,photos_urls,' +
      'digital_signature,created_at,user_id,promoted,boost_expires_at,lat,lng'
    )
    .eq('status', 'published')
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
