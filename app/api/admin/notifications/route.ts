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

// GET /api/admin/notifications — unread notifications
export async function GET() {
  if (!(await checkIsAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const service = createServiceClient();
  const { data, error } = await service
    .from('notifications')
    .select('id, type, message, link, created_at, read_at')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('[api/admin/notifications] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ notifications: data ?? [] });
}

// PATCH /api/admin/notifications — mark one as read
export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = await request.json() as { id: string };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const service = createServiceClient();
  const { error } = await service
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/notifications — mark all as read
export async function DELETE() {
  if (!(await checkIsAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const service = createServiceClient();
  await service
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
  return NextResponse.json({ success: true });
}
