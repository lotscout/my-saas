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

export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const search = (searchParams.get('search') ?? '').trim();
  const type = (searchParams.get('type') ?? '').trim();
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const service = createServiceClient();
  let query = service
    .from('email_logs')
    .select('id, user_id, to_email, from_email, subject, email_type, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`to_email.ilike.%${search}%,subject.ilike.%${search}%`);
  }
  if (type) {
    query = query.eq('email_type', type);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[api/admin/email-logs] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [], total: count ?? 0, page, pageSize });
}
