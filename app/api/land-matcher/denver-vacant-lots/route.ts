import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin-server';
import { requestHasLandMatcherAccess } from '@/lib/internal-access';
import data from '@/data/attom-denver-vacant-lots.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const isAdmin = await checkIsAdmin(request);
  if (!isAdmin && !requestHasLandMatcherAccess(request)) {
    return NextResponse.json({ error: 'Internal access required.' }, { status: 403 });
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=300',
    },
  });
}
