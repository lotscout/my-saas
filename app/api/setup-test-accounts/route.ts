import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// One-shot endpoint to seed 4 QA test accounts.
// DELETE this route before going to production.
// Requires SUPABASE_SERVICE_ROLE_KEY in env — never accepts it as input.

const ACCOUNTS = [
  { email: 'teststandard@lotscout.com',  password: 'TestStandard123!',  tier: 'standard'  as string | null, firstName: 'Test', lastName: 'Standard'  },
  { email: 'testpriority@lotscout.com',  password: 'TestPriority123!',  tier: 'priority'  as string | null, firstName: 'Test', lastName: 'Priority'  },
  { email: 'testexclusive@lotscout.com', password: 'TestExclusive123!', tier: 'exclusive' as string | null, firstName: 'Test', lastName: 'Exclusive' },
  { email: 'testfree@lotscout.com',      password: 'TestFree123!',      tier: null,                        firstName: 'Test', lastName: 'Free'      },
];

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: { email: string; status: string; userId?: string; error?: string }[] = [];

  for (const account of ACCOUNTS) {
    try {
      // Create or update auth user
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });

      let userId: string;

      if (createError) {
        if (createError.message.includes('already been registered') || createError.code === 'email_exists') {
          // User exists — fetch by email and update password
          const { data: list, error: listError } = await admin.auth.admin.listUsers();
          if (listError) throw listError;
          const existing = list.users.find(u => u.email === account.email);
          if (!existing) throw new Error(`User not found after conflict: ${account.email}`);
          await admin.auth.admin.updateUserById(existing.id, {
            password: account.password,
            email_confirm: true,
          });
          userId = existing.id;
        } else {
          throw createError;
        }
      } else {
        userId = created.user.id;
      }

      // Upsert profile
      const { error: profileError } = await admin
        .from('profiles')
        .upsert({ id: userId, email: account.email, first_name: account.firstName, last_name: account.lastName }, { onConflict: 'id' });
      if (profileError) throw profileError;

      // Upsert subscription (skip for free tier)
      if (account.tier) {
        const { error: subError } = await admin
          .from('subscriptions')
          .upsert(
            { user_id: userId, tier: account.tier, status: 'active', cancel_at_period_end: false, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        if (subError) throw subError;
      }

      results.push({ email: account.email, status: 'ok', userId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? JSON.stringify(err);
      results.push({ email: account.email, status: 'error', error: msg });
    }
  }

  const allOk = results.every(r => r.status === 'ok');
  return NextResponse.json({ success: allOk, results }, { status: allOk ? 200 : 207 });
}
