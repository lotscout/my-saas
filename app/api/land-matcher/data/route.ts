import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin-server';
import { createServiceClient } from '@/lib/supabase/service';
import { requestHasLandMatcherAccess } from '@/lib/internal-access';

function mapBuyer(row: any) {
  return {
    id: row.id,
    company: row.company,
    contactName: row.contact_name || 'Acquisitions',
    market: row.market || 'Denver',
    neighborhoods: row.neighborhoods || [],
    zoning: row.zoning || [],
    minLotSqft: row.min_lot_sqft || 0,
    maxLotSqft: row.max_lot_sqft || 999999,
    maxPrice: Number(row.max_price || 999999999),
    buildType: row.build_type || 'Denver land',
    notes: row.notes || '',
    status: row.status || 'active',
  };
}

function mapParcel(row: any) {
  return {
    id: row.id,
    attomId: row.attom_id,
    address: row.address,
    neighborhood: row.neighborhood || 'Denver',
    city: row.city || 'Denver',
    state: row.state || 'CO',
    zip: row.zip || '',
    ownerName: row.owner_name || 'Unknown owner',
    ownerMailingAddress: row.owner_mailing_address || '',
    ownerType: row.owner_type || 'Individual',
    absenteeOwner: row.absentee_owner === true,
    outOfStateOwner: row.out_of_state_owner === true,
    lotSqft: row.lot_sqft || 0,
    zoning: row.zoning || 'Unknown',
    landUse: row.land_use || 'Vacant land',
    assessedValue: Number(row.assessed_value || 0),
    lastSalePrice: row.last_sale_price ? Number(row.last_sale_price) : undefined,
    lastSaleYear: row.last_sale_year || undefined,
    yearsOwned: row.years_owned || 0,
    taxDelinquent: row.tax_delinquent === true,
    lat: row.lat || 0,
    lng: row.lng || 0,
    flags: row.flags || [],
    contactStatus: 'new',
  };
}

export async function GET(request: Request) {
  const isAdmin = await checkIsAdmin(request);
  if (!isAdmin && !requestHasLandMatcherAccess(request)) {
    return NextResponse.json({ error: 'Internal access required.' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const [{ data: buyers, error: buyersError }, { data: parcels, error: parcelsError }] = await Promise.all([
    supabase.from('land_matcher_buyers').select('*').in('status', ['active', 'warm']).order('company'),
    supabase.from('land_matcher_parcels').select('*').eq('city', 'Denver').eq('state', 'CO').order('updated_at', { ascending: false }).limit(750),
  ]);

  if (buyersError || parcelsError) {
    return NextResponse.json({
      error: 'Could not load Land Matcher data.',
      details: buyersError?.message || parcelsError?.message,
    }, { status: 500 });
  }

  return NextResponse.json({
    buyers: (buyers ?? []).map(mapBuyer),
    parcels: (parcels ?? []).map(mapParcel),
    source: 'real-attom-denver',
    counts: { buyers: buyers?.length ?? 0, parcels: parcels?.length ?? 0 },
  });
}
