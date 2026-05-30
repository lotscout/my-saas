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

  const [{ data: profiles }, { data: subs }] = await Promise.all([
    service.from('profiles').select('*').order('created_at', { ascending: false }),
    service.from('subscriptions').select('user_id, tier').eq('status', 'active'),
  ]);

  const tierByUser: Record<string, string> = {};
  for (const s of subs ?? []) {
    tierByUser[s.user_id] = s.tier;
  }

  const users = (profiles ?? []).map((p: Record<string, unknown>) => ({
    id: p.id,
    email: p.email ?? null,
    first_name: p.first_name ?? null,
    last_name: p.last_name ?? null,
    full_name: p.full_name ?? null,
    company_name: p.company_name ?? null,
    state: p.state ?? null,
    subscription_tier: tierByUser[p.id as string] ?? 'free',
    is_admin: p.is_admin !== undefined
      ? Boolean(p.is_admin)
      : ADMIN_EMAILS.includes((p.email as string) ?? ''),
    is_test_profile: Boolean(p.is_test_profile),
    created_at: p.created_at,
    updated_at: p.updated_at ?? p.created_at,
  }));

  return NextResponse.json({ users });
}
