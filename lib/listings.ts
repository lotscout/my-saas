import type { SupabaseClient } from '@supabase/supabase-js';

// Returns the start of the current 30-day billing period based on the user's
// signup date. Example: signed up Apr 17 → period resets May 17, Jun 17, etc.
export function getPeriodStart(signupDate: string): Date {
  const signup = new Date(signupDate);
  const now = new Date();

  // Build a candidate period start in the current month
  const candidate = new Date(now.getFullYear(), now.getMonth(), signup.getDate());

  // If the candidate is in the future, step back one month
  if (candidate > now) {
    candidate.setMonth(candidate.getMonth() - 1);
  }

  return candidate;
}

export async function getListingsThisPeriod(
  supabase: SupabaseClient,
  userId: string,
  signupDate: string
): Promise<number> {
  const periodStart = getPeriodStart(signupDate);

  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString());

  if (error) return 0;
  return count ?? 0;
}
