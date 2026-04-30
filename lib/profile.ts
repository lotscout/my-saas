import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tier } from './permissions';
import { isAdminEmail } from './admin';

export interface UserProfile {
  id: string;
  tier: Tier;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_admin: boolean;
}

export async function getUserProfile(
  supabase: SupabaseClient
): Promise<UserProfile | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, created_at, first_name, last_name, email')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  // Look up tier from subscriptions table
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // Admin: email-based check (works without DB column; DB column checked after migration)
  const is_admin = isAdminEmail(user.email);

  return {
    ...data,
    tier: (sub?.tier ?? null) as Tier,
    is_admin,
  } as UserProfile;
}
