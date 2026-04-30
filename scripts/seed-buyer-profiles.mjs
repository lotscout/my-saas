/**
 * Seed script: insert 185 buyer request profiles from CSV
 * Run: node scripts/seed-buyer-profiles.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

// Read CSV
const csvPath = join(__dirname, '../buyer_profiles_seed.csv');
const csvContent = readFileSync(csvPath, 'utf8');
const rows = parse(csvContent, { columns: true, skip_empty_lines: true });

// Helper: split pipe-delimited strings into arrays
function splitPipe(val) {
  if (!val || val.trim() === '') return [];
  return val.split('|').map(s => s.trim()).filter(Boolean);
}

// Helper: safe numeric
function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// We need a placeholder auth user for seeded profiles.
// We'll create a "seed" auth user once and reuse its id, OR
// insert directly into profiles table (which requires a matching auth.users row).
// Best approach: insert into profiles + buyer_requests using a seed service account UUID.
// We'll use a fixed UUID as a seed placeholder user.
const SEED_USER_ID = '00000000-seed-seed-seed-000000000001';

// Step 1: Ensure the seed profile user exists in auth.users via admin API
async function ensureSeedUser() {
  // Try to find existing seed user by email
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (!listErr && list?.users) {
    const existing = list.users.find(u => u.email === 'seed-profiles@lotscout.com');
    if (existing) {
      console.log('✅ Seed user already exists:', existing.id);
      return existing.id;
    }
  }
  // Create it
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: 'seed-profiles@lotscout.com',
    password: 'SeedAccount999!',
    email_confirm: true,
    user_metadata: { first_name: 'Seed', last_name: 'Profile' },
  });
  if (createErr) {
    console.error('Failed to create seed user:', createErr.message);
    process.exit(1);
  }
  console.log('✅ Created seed user:', created.user.id);
  return created.user.id;
}

async function main() {
  console.log(`📋 Seeding ${rows.length} buyer profiles...`);

  const userId = await ensureSeedUser();

  // Batch upsert buyer_requests (is_test_profile = true)
  const records = rows.map(r => ({
    user_id: userId,
    status: 'active',
    is_test_profile: true,
    // location targeting
    target_regions: [r.targetState, r.targetCity, r.targetCounty].filter(Boolean),
    target_state: r.targetState || null,
    target_county: r.targetCounty || null,
    target_city: r.targetCity || null,
    target_zip: r.targetZip || null,
    state: r.state || null,
    // budget
    budget_min: num(r.budMin),
    budget_max: num(r.budMax),
    price_per_acre: num(r.pricePerAcre),
    // acreage
    min_acreage: num(r.acreMin),
    max_acreage: num(r.acreMax),
    // preferences
    zoning_preference: splitPipe(r.zoning),
    road_access: r.roadAccess || null,
    utilities: splitPipe(r.utilities),
    financing: r.financing || null,
    timeline: r.timeline || '',
    use_case: r.useCase || '',
    use_case_description: r.useCaseDesc || null,
    specific_requirements: r.specificReq || null,
    contact_preference: [],
    additional_notes: null,
  }));

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('buyer_requests').insert(batch);
    if (error) {
      console.error(`❌ Batch ${i}–${i + BATCH} failed:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`✅ Inserted ${inserted}/${records.length}`);
  }

  console.log(`\n🎉 Done! ${inserted} buyer profiles seeded.`);
}

main().catch(err => { console.error(err); process.exit(1); });
