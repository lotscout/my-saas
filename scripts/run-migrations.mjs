/**
 * Runs DDL migrations directly against Supabase postgres.
 * Uses session pooler (port 5432) with service role JWT as password.
 * Run: node scripts/run-migrations.mjs
 */
import pg from 'pg';
const { Client } = pg;

const PROJECT_REF = 'axiockuobpttlwzicldo';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk';

// Supabase session pooler: user = postgres.[ref], password = service_role_key
const client = new Client({
  host: `aws-0-us-east-1.pooler.supabase.com`,
  port: 5432,
  database: 'postgres',
  user: `postgres.${PROJECT_REF}`,
  password: SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false },
});

const MIGRATIONS = [
  // profiles additions
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text`,

  // buyer_requests additions
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS price_per_acre numeric`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS area_unit text DEFAULT 'acres'`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS road_access text[]`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS utilities text[]`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS financing text[]`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS use_case_description text`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS specific_requirements text`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS working_with_agent boolean DEFAULT false`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_close_date date`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_state text`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_county text`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_city text`,
  `ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_zip text`,

  // set admins
  `UPDATE profiles SET is_admin = true WHERE email IN ('bobby@lotscout.com', 'bobby.r.oliver@gmail.com', 'support@lotscout.com')`,
  `UPDATE profiles SET subscription_tier = 'exclusive' WHERE email IN ('bobby.r.oliver@gmail.com', 'support@lotscout.com')`,
];

async function main() {
  console.log('Connecting to Supabase postgres...');
  await client.connect();
  console.log('Connected.\n');

  for (const sql of MIGRATIONS) {
    try {
      await client.query(sql);
      console.log('✓', sql.slice(0, 80));
    } catch (err) {
      console.error('✗', sql.slice(0, 80));
      console.error('  Error:', err.message);
    }
  }

  await client.end();
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
