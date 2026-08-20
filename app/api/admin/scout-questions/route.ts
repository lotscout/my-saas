import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
};

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

function displayName(profile: Profile | undefined) {
  if (!profile) return 'Guest';
  return profile.full_name
    || [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    || profile.company_name
    || profile.email
    || 'Unknown user';
}

export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get('pageSize') || '50')));
  const q = (url.searchParams.get('q') || '').trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = service
    .from('advisor_conversations')
    .select('id,user_id,content,created_at', { count: 'exact' })
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (q) query = query.ilike('content', `%${q}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((data ?? []).map((row: any) => row.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await service.from('profiles').select('id,email,full_name,first_name,last_name,company_name').in('id', userIds)
    : { data: [] };
  const profileMap = new Map<string, Profile>((profiles ?? []).map((p: Profile) => [p.id, p]));

  return NextResponse.json({
    page,
    pageSize,
    total: count ?? 0,
    questions: (data ?? []).map((row: any) => {
      const profile = row.user_id ? profileMap.get(row.user_id) : undefined;
      return {
        id: row.id,
        user_id: row.user_id,
        asker: displayName(profile),
        email: profile?.email ?? null,
        question: row.content ?? '',
        created_at: row.created_at,
      };
    }),
  });
}
