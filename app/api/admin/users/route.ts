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
  const { data } = await service.from('profiles').select('*').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();

  // select('*') so the query never fails due to a missing column
  // (is_admin will appear here once the migration has been run)
  const { data: profiles, error } = await service
    .from('profiles')
    .select('*')
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

  const users = (profiles ?? []).map((p: Record<string, unknown>) => ({
    id: p.id,
    email: p.email,
    first_name: p.first_name,
    last_name: p.last_name,
    full_name: p.full_name,
    company_name: p.company_name,
    created_at: p.created_at,
    tier: tierByUser[p.id as string] ?? null,
    // Use DB value when column exists; fall back to email list until migration runs
    is_admin: p.is_admin !== undefined
      ? Boolean(p.is_admin)
      : ADMIN_EMAILS.includes((p.email as string) ?? ''),
  }));

  return NextResponse.json({ users });
}
