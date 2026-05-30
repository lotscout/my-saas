import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('*').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const service = createServiceClient();

  const [
    { data: profile },
    { data: listings },
    { data: buyerRequests },
    { data: subscription },
  ] = await Promise.all([
    service.from('profiles').select('*').eq('id', id).single(),
    service
      .from('listings')
      .select('id, title, status, state, county, asking_price, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    service
      .from('buyer_requests')
      .select('id, status, target_state, use_case, budget_min, budget_max, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    service
      .from('subscriptions')
      .select('tier, status, created_at')
      .eq('user_id', id)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  return NextResponse.json({
    profile: profile ?? {},
    listings: listings ?? [],
    buyerRequests: buyerRequests ?? [],
    subscription,
  });
}
