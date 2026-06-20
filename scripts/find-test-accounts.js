// Lists test/fake auth accounts (emails matching example.com, "test", or "diag_").
// Uses the Supabase admin API (auth.users isn't exposed via PostgREST).
// Run: node scripts/find-test-accounts.js   (needs SUPABASE_SERVICE_ROLE_KEY in env)

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const PATTERN = /(example\.com$|test|^diag_)/i;

(async () => {
  let page = 1;
  let all = [];
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error('ERROR:', error.message); process.exit(1); }
    all = all.concat(data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  const matches = all
    .filter(u => PATTERN.test(u.email || ''))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  console.log(`total users: ${all.length}`);
  console.log(`test/fake accounts: ${matches.length}\n`);
  console.log('created_at'.padEnd(26), 'status'.padEnd(12), 'email'.padEnd(34), 'id');
  for (const u of matches) {
    console.log(
      String(u.created_at).padEnd(26),
      (u.email_confirmed_at ? 'confirmed' : 'UNCONFIRMED').padEnd(12),
      String(u.email).padEnd(34),
      u.id
    );
  }
})();
