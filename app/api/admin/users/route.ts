import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail, ADMIN_EMAILS } from '@/lib/admin';

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();

  // Fetch profiles — only columns that exist in the table
  const { data: profiles, error } = await service
    .from('profiles')
    .select('id, email, first_name, last_name, full_name, company_name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch active subscriptions for tier info (tier lives in subscriptions, not profiles)
  const { data: subs } = await service
    .from('subscriptions')
    .select('user_id, tier')
    .eq('status', 'active');

  const tierByUser: Record<string, string> = {};
  for (const s of subs ?? []) {
    tierByUser[s.user_id] = s.tier;
  }

  const users = (profiles ?? []).map(p => ({
    ...p,
    tier: tierByUser[p.id] ?? null,
    // is_admin derived from email until profiles.is_admin column migration runs
    is_admin: ADMIN_EMAILS.includes(p.email ?? ''),
  }));

  return NextResponse.json({ users });
}
