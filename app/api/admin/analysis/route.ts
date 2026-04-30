import { NextResponse } from 'next/server';
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

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();

  const { data: requests, error } = await service
    .from('property_analysis_requests')
    .select('id, input_type, street_address, city, county, state, zip_code, apn, status, report_url, submitted_at, user_id')
    .order('submitted_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!requests?.length) {
    return NextResponse.json({ requests: [] });
  }

  const userIds = [...new Set(requests.map(r => r.user_id).filter(Boolean))];
  const { data: profiles } = await service
    .from('profiles')
    .select('id, email, first_name, last_name, full_name')
    .in('id', userIds);

  const profileMap: Record<string, { email: string | null; name: string }> = {};
  (profiles ?? []).forEach((p: { id: string; email: string | null; first_name: string | null; last_name: string | null; full_name: string | null }) => {
    profileMap[p.id] = {
      email: p.email,
      name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
    };
  });

  const enriched = requests.map(r => ({
    ...r,
    user: profileMap[r.user_id] ?? { email: null, name: 'Unknown' },
  }));

  return NextResponse.json({ requests: enriched });
}
