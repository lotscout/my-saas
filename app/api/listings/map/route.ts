import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';
import COUNTY_CENTROIDS from '@/lib/county-centroids.json';

const centroids = COUNTY_CENTROIDS as Record<string, [number, number] | null>;

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('listings')
    .select('id,title,state,county,lot_size_acres,lot_size_sqft,asking_price,zoning,ownership_type')
    .eq('status', 'published');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withCoords = (data ?? [])
    .map(listing => {
      const key = `${listing.county}|${listing.state}`;
      const coords = centroids[key];
      if (!coords) return null;
      // Add small jitter so overlapping county pins don't stack exactly
      const jitter = () => (Math.random() - 0.5) * 0.15;
      return { ...listing, latitude: coords[0] + jitter(), longitude: coords[1] + jitter() };
    })
    .filter(Boolean);

  return NextResponse.json(withCoords);
}
