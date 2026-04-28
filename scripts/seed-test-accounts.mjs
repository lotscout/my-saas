// Seed 4 test accounts for LotScout QA
// Run with: node scripts/seed-test-accounts.mjs

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const ACCOUNTS = [
  { email: 'teststandard@lotscout.com',  password: 'TestStandard123!',  tier: 'standard',  firstName: 'Test', lastName: 'Standard'  },
  { email: 'testpriority@lotscout.com',  password: 'TestPriority123!',  tier: 'priority',  firstName: 'Test', lastName: 'Priority'  },
  { email: 'testexclusive@lotscout.com', password: 'TestExclusive123!', tier: 'exclusive', firstName: 'Test', lastName: 'Exclusive' },
  { email: 'testfree@lotscout.com',      password: 'TestFree123!',      tier: null,        firstName: 'Test', lastName: 'Free'      },
];

async function adminFetch(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function createOrGetUser(email, password) {
  // Try to create; if email already exists Supabase returns 422
  const { ok, status, json } = await adminFetch('/auth/v1/admin/users', 'POST', {
    email,
    password,
    email_confirm: true,   // mark confirmed so no verification email needed
  });

  if (ok) {
    console.log(`  ✓ Created auth user: ${email} (id: ${json.id})`);
    return json.id;
  }

  if (status === 422 && json.msg?.includes('already been registered')) {
    // Fetch existing user by email
    const list = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`, 'GET');
    if (list.ok && list.json.users?.length) {
      const uid = list.json.users[0].id;
      // Update password + confirm email
      await adminFetch(`/auth/v1/admin/users/${uid}`, 'PUT', {
        password,
        email_confirm: true,
      });
      console.log(`  ~ Updated existing auth user: ${email} (id: ${uid})`);
      return uid;
    }
  }

  throw new Error(`Failed to create/get user ${email}: ${JSON.stringify(json)}`);
}

async function upsertProfile(id, email, firstName, lastName, tier) {
  const { ok, json } = await adminFetch('/rest/v1/profiles', 'POST', {
    id,
    email,
    first_name: firstName,
    last_name: lastName,
    tier,
  });

  if (!ok) {
    // Try upsert via PATCH if row already exists (conflict on id)
    const patch = await adminFetch(`/rest/v1/profiles?id=eq.${id}`, 'PATCH', {
      email,
      first_name: firstName,
      last_name: lastName,
      tier,
    });
    if (!patch.ok) throw new Error(`Profile upsert failed for ${email}: ${JSON.stringify(patch.json)}`);
    console.log(`  ~ Updated existing profile: ${email}`);
  } else {
    console.log(`  ✓ Created profile: ${email}`);
  }
}

async function upsertSubscription(userId, tier) {
  // POST with upsert header (Prefer: resolution=merge-duplicates)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: userId,
      tier,
      status: 'active',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Subscription upsert failed for user ${userId}: ${txt}`);
  }
  console.log(`  ✓ Upserted subscription: tier=${tier} for user ${userId}`);
}

async function main() {
  for (const account of ACCOUNTS) {
    console.log(`\nProcessing ${account.email}...`);
    const uid = await createOrGetUser(account.email, account.password);
    await upsertProfile(uid, account.email, account.firstName, account.lastName, account.tier);
    if (account.tier) await upsertSubscription(uid, account.tier);
    else console.log(`  ✓ No subscription row (free tier)`)
  }
  console.log('\n✅ All test accounts ready.');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
