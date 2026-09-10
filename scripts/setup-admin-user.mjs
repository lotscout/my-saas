/**
 * One-time script: create support@lotscout.com auth user + admin profile,
 * and grant bobby.r.oliver@gmail.com exclusive+admin.
 *
 * Run: node scripts/setup-admin-user.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const SUPPORT_ADMIN_PASSWORD = process.env.SUPPORT_ADMIN_PASSWORD;
if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
if (!SUPPORT_ADMIN_PASSWORD) throw new Error('SUPPORT_ADMIN_PASSWORD is required');

const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // ── 1. Create or find support@lotscout.com ──────────────────────────────
  console.log('Creating auth user support@lotscout.com...');
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: 'support@lotscout.com',
    password: SUPPORT_ADMIN_PASSWORD,
    email_confirm: true,
  });

  let userId;
  if (createErr) {
    if (createErr.message.includes('already been registered') || createErr.code === 'email_exists') {
      console.log('User already exists, looking up by email...');
      const { data: list } = await service.auth.admin.listUsers();
      const existing = list?.users?.find(u => u.email === 'support@lotscout.com');
      if (!existing) throw new Error('Could not find existing user');
      userId = existing.id;
      console.log('Found existing user:', userId);
    } else {
      throw createErr;
    }
  } else {
    userId = created.user.id;
    console.log('Created user:', userId);
  }

  // ── 2. Upsert profile for support@lotscout.com ─────────────────────────
  // Note: is_admin and subscription_tier columns require the migration to be
  // run first in Supabase SQL editor. See lib/admin.ts for the SQL.
  console.log('Upserting profile...');
  const { error: profileErr } = await service
    .from('profiles')
    .upsert({
      id: userId,
      email: 'support@lotscout.com',
      first_name: 'LotScout',
      last_name: 'Admin',
    }, { onConflict: 'id' });

  if (profileErr) {
    console.error('Profile upsert error:', profileErr.message);
  } else {
    console.log('Profile upserted for support@lotscout.com');
  }

  // Also insert a subscription row so tier is picked up by usePermissions
  const { error: subErr } = await service
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier: 'exclusive',
      status: 'active',
    }, { onConflict: 'user_id' });

  if (subErr) {
    console.warn('Subscription upsert warning (column may not exist):', subErr.message);
  } else {
    console.log('Subscription row upserted for support@lotscout.com');
  }

  // ── 3. bobby.r.oliver@gmail.com — subscription tier only (is_admin via email) ─
  // is_admin column update deferred until migration runs. See lib/admin.ts.
  console.log('Verifying bobby.r.oliver@gmail.com profile...');
  const { data: bobbyCheck } = await service
    .from('profiles')
    .select('id, email')
    .eq('email', 'bobby.r.oliver@gmail.com')
    .single();

  if (bobbyCheck) {
    console.log('Found bobby profile:', bobbyCheck.id);
  } else {
    console.warn('bobby.r.oliver@gmail.com not found in profiles yet');
  }

  // Also upsert subscription for bobby
  const { data: bobbyProfile } = await service
    .from('profiles')
    .select('id')
    .eq('email', 'bobby.r.oliver@gmail.com')
    .single();

  if (bobbyProfile?.id) {
    const { error: bobbySubErr } = await service
      .from('subscriptions')
      .upsert({ user_id: bobbyProfile.id, tier: 'exclusive', status: 'active' }, { onConflict: 'user_id' });
    if (bobbySubErr) {
      console.warn('Bobby subscription upsert warning:', bobbySubErr.message);
    } else {
      console.log('Subscription row upserted for bobby');
    }
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
