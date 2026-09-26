import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin-server';

const ATTOM_BASE_URL = process.env.ATTOM_BASE_URL || 'https://api.gateway.attomdata.com';
const ATTOM_SEARCH_PATH = process.env.ATTOM_PROPERTY_SEARCH_PATH || '/propertyapi/v1.0.0/property/address';

type AttomImportRequest = {
  postalCode?: string;
  city?: string;
  state?: string;
  page?: number;
  pageSize?: number;
};

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const apiKey = process.env.ATTOM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'ATTOM_API_KEY is not configured yet.',
        nextStep: 'Add ATTOM_API_KEY to Vercel/env, then this route can import parcel data into the Land Matcher pipeline.',
      },
      { status: 501 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as AttomImportRequest;
  const params = new URLSearchParams();

  if (body.postalCode) params.set('postalcode', body.postalCode);
  if (body.city) params.set('city', body.city);
  if (body.state) params.set('state', body.state);
  params.set('propertytype', 'VACANT LAND');
  params.set('page', String(body.page ?? 1));
  params.set('pagesize', String(body.pageSize ?? 100));

  const response = await fetch(`${ATTOM_BASE_URL}${ATTOM_SEARCH_PATH}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      apikey: apiKey,
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        error: 'ATTOM request failed.',
        status: response.status,
        details: data,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    source: 'attom',
    imported: false,
    message: 'ATTOM connection succeeded. Next step is mapping response fields into land_matcher_parcels.',
    data,
  });
}
