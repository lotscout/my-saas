/**
 * Central admin configuration.
 *
 * Admin status is determined by email match (works without DB) OR
 * by profiles.is_admin = true (after running the migration below).
 *
 * Migration to run in Supabase SQL editor:
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text;
 *   UPDATE profiles SET is_admin = true WHERE email IN ('bobby@lotscout.com', 'bobby.r.oliver@gmail.com', 'support@lotscout.com');
 *   UPDATE profiles SET subscription_tier = 'exclusive' WHERE email IN ('bobby.r.oliver@gmail.com', 'support@lotscout.com');
 */
export const ADMIN_EMAILS = [
  'bobby@lotscout.com',
  'bobby.r.oliver@gmail.com',
  'support@lotscout.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(email ?? '');
}
