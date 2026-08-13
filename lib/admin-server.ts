import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export type AdminAuthUser = { id: string; email?: string | null };

export async function getAdminUser(request?: Request): Promise<AdminAuthUser | null> {
  const service = createServiceClient();

  const authHeader = request?.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';

  if (token) {
    const { data: { user }, error } = await service.auth.getUser(token);
    if (!error && user) {
      if (isAdminEmail(user.email)) return { id: user.id, email: user.email };
      const { data: profile } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
      if (profile?.is_admin === true) return { id: user.id, email: user.email };
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (isAdminEmail(user.email)) return { id: user.id, email: user.email };
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true ? { id: user.id, email: user.email } : null;
}

export async function checkIsAdmin(request?: Request): Promise<boolean> {
  return !!(await getAdminUser(request));
}
