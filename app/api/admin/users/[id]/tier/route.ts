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
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as { tier: string };
  const { tier } = body;

  const VALID_TIERS = ['free', 'standard', 'priority', 'exclusive'];
  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const service = createServiceClient();

  // Tier lives in the subscriptions table, not profiles
  // Deactivate any existing active subscriptions first
  await service
    .from('subscriptions')
    .update({ status: 'inactive' })
    .eq('user_id', id)
    .eq('status', 'active');

  if (tier !== 'free') {
    const { error } = await service
      .from('subscriptions')
      .insert({ user_id: id, tier, status: 'active' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
