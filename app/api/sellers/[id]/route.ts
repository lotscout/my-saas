import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing seller id' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const [profileResult, listingsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, bio, avatar_url, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('listings')
      .select('id, title, state, county, lot_size_acres, lot_size_sqft, asking_price')
      .eq('user_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ]);

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  return NextResponse.json({
    profile: profileResult.data,
    listings: listingsResult.data ?? [],
  });
}
