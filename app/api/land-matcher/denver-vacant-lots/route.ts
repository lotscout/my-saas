import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin-server';
import { requestHasLandMatcherAccess } from '@/lib/internal-access';
import { createClient } from '@/lib/supabase/server';
import data from '@/data/attom-denver-vacant-lots.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const isAdmin = await checkIsAdmin(request);
  const hasInternalToken = requestHasLandMatcherAccess(request);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdmin && !hasInternalToken && !user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=300',
    },
  });
}
