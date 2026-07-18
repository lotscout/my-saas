// fix-display-company.js
// Diagnoses why display_company is null in buyer_requests and fixes it.
// Run: node fix-display-company.js
// Add --fix to actually apply updates.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SEED_COMPANIES = {
  NY: ['Open Space Institute','Nature Conservancy — NY','Toll Brothers — New York','New York Land Conservancy','Adirondack Land Trust','Catskill Center Land Partners','Finger Lakes Land Trust','Long Island Land Alliance','Hudson Valley Land Buyers','Upstate NY Farmland Partners','Tompkins County Land Trust','Capital District Land Partners','Catskill Mountain Land Partners','Buffalo Western NY Land','North Country Land Trust NY','Rochester NY Land Investors','Thousand Islands Land Trust','Western Catskills Land Partners','NY Timber Buyers Association','Susquehanna Land Trust NY'],
  NC: ['Conservation Trust of NC','Weyerhaeuser — NC','Rayonier Timberlands — NC','D.R. Horton — NC','Ducks Unlimited — NC','Triangle Land Conservancy','Southern Appalachian Land Trust','Catawba Lands Conservancy','NC Coastal Land Trust','Meritage Homes — NC','NC Land Buyers Group','Piedmont Land Conservancy','Yadkin Valley Land Trust','Outer Banks Land Partners','Blue Ridge Land Partners','Charlotte Land Investors','NC Tobacco Land Partners','Sandhills Area Land Trust','LGI Homes — NC','Lumber River Land Partners'],
  ND: ['ND Farm Bureau Land','Farmland Partners — ND','ND Land Trust','Ducks Unlimited — ND','Dakota Land Partners','ND Grazing Land Partners','Western ND Energy Land','Williston Basin Land Partners','Red River Valley Land Partners','ND Hunting Land Trust','Theodore Roosevelt Land Partners','Garrison Land Buyers','Bismarck Area Land Partners','Minot Region Land Buyers','Valley City Area Land Partners','Grand Forks Land Trust','Lake Region Land Partners','Southeastern ND Land Partners','Crosby Area Land Partners','Rolette County Land Partners'],
};

async function main() {
  const applyFix = process.argv.includes('--fix');

  console.log('=== Fetching buyer_requests with null display_company ===\n');

  const { data: nullRows, error: nullErr } = await sb
    .from('buyer_requests')
    .select('id, display_company, budget_min, budget_max, min_acreage, target_state, use_case, user_id')
    .is('display_company', null)
    .order('target_state', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(500);

  if (nullErr) {
    console.error('Error fetching rows:', nullErr.message);
    return;
  }

  console.log(`Found ${nullRows.length} rows with null display_company`);

  const { data: allRows, error: allErr } = await sb
    .from('buyer_requests')
    .select('id, display_company')
    .limit(1);
  if (allErr) {
    console.error('Error checking all rows:', allErr.message);
    return;
  }

  // Show sample budget values to identify the seed type
  console.log('\nSample budget_min values (first 5 null rows):');
  nullRows.slice(0, 5).forEach(r => {
    console.log(`  state=${r.target_state} budget_min=${r.budget_min} budget_max=${r.budget_max} min_acreage=${r.min_acreage} use_case=${r.use_case}`);
  });

  // Check for seed user
  const { data: authData } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const seedUser = authData?.users?.find(u => u.email === 'seed-buyers@lotscout.com');
  console.log(`\nSeed user (seed-buyers@lotscout.com): ${seedUser ? seedUser.id : 'NOT FOUND'}`);

  if (!seedUser) {
    console.log('\nNo seed user found. Cannot proceed with fix.');
    return;
  }

  // Fetch all rows for the seed user, ordered by state + created_at
  const { data: seedRows, error: seedErr } = await sb
    .from('buyer_requests')
    .select('id, target_state, budget_min, budget_max, min_acreage, use_case, display_company')
    .eq('user_id', seedUser.id)
    .order('target_state', { ascending: true })
    .order('created_at', { ascending: true });

  if (seedErr) {
    console.error('Error fetching seed rows:', seedErr.message);
    return;
  }

  console.log(`\nTotal seed user rows: ${seedRows.length}`);

  // Group by state
  const byState = {};
  for (const row of seedRows) {
    const st = row.target_state || 'UNKNOWN';
    if (!byState[st]) byState[st] = [];
    byState[st].push(row);
  }

  console.log('\nRows per state (seed user):');
  for (const [st, rows] of Object.entries(byState)) {
    const hasNames = rows.filter(r => r.display_company).length;
    console.log(`  ${st}: ${rows.length} rows, ${hasNames} with display_company`);
  }

  if (!applyFix) {
    console.log('\n--- Run with --fix to apply display_company updates ---');
    return;
  }

  console.log('\n=== Applying fix: updating display_company by position per state ===\n');

  let updated = 0;
  let skipped = 0;

  for (const [state, rows] of Object.entries(byState)) {
    const companies = SEED_COMPANIES[state];
    if (!companies) {
      // For states not in SEED_COMPANIES, derive from use_case + state
      for (const row of rows) {
        if (row.display_company) { skipped++; continue; }
        const derived = `${row.use_case || 'Land'} Buyer — ${state}`;
        const { error } = await sb.from('buyer_requests')
          .update({ display_company: derived })
          .eq('id', row.id);
        if (error) console.error(`  Error updating ${row.id}:`, error.message);
        else { updated++; process.stdout.write('.'); }
      }
      continue;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.display_company) { skipped++; continue; }
      const company = companies[i] || `${state} Land Buyer ${i + 1}`;
      const { error } = await sb.from('buyer_requests')
        .update({ display_company: company })
        .eq('id', row.id);
      if (error) console.error(`\n  Error updating ${row.id}:`, error.message);
      else { updated++; process.stdout.write('.'); }
    }
  }

  console.log(`\n\nDone! Updated ${updated} rows, skipped ${skipped} (already had display_company).`);
}

main().catch(console.error);
