import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tier } from './permissions';

export interface UserProfile {
  id: string;
  tier: Tier;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export async function getUserProfile(
  supabase: SupabaseClient
): Promise<UserProfile | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, tier, created_at, first_name, last_name, email')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  return data as UserProfile;
}
