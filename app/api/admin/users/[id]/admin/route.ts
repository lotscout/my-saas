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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as { is_admin: boolean };

  const service = createServiceClient();

  // profiles.is_admin column requires the migration in lib/admin.ts to be run first.
  // If the column doesn't exist yet, the update is silently skipped (admin status
  // is still determined by ADMIN_EMAILS in lib/admin.ts).
  const { error } = await service
    .from('profiles')
    .update({ is_admin: body.is_admin })
    .eq('id', id);

  if (error) {
    // PGRST204 = column not found — migration not run yet, non-fatal
    if (error.code === 'PGRST204' || error.message?.includes('is_admin')) {
      return NextResponse.json({ success: true, warning: 'Run is_admin migration to persist this change.' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
