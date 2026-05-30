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

  const { data: request, error } = await service
    .from('buyer_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const { data: submitter } = await service
    .from('profiles')
    .select('id, email, first_name, last_name, full_name, company_name, created_at')
    .eq('id', request.user_id)
    .single();

  const { data: sub } = await service
    .from('subscriptions')
    .select('tier')
    .eq('user_id', request.user_id)
    .eq('status', 'active')
    .maybeSingle();

  return NextResponse.json({
    request,
    submitter: submitter ?? null,
    submitterTier: sub?.tier ?? 'free',
  });
}
