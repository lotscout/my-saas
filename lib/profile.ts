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

  // select('*') so this never fails due to missing columns
  // (is_admin will be present once the migration has run)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  // Look up tier from subscriptions table
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  // Use DB column when it exists; fall back to email list until migration runs
  const is_admin = data.is_admin !== undefined && data.is_admin !== null
    ? Boolean(data.is_admin)
    : isAdminEmail(user.email);

  return {
    id: data.id,
    created_at: data.created_at,
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    email: data.email ?? user.email ?? null,
    tier: (sub?.tier ?? data.subscription_tier ?? null) as Tier,
    is_admin,
  };
}
