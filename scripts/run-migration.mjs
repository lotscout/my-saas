/**
 * Run schema migration via Supabase REST API
 * Creates exec_sql RPC if needed, then applies migrations
 *
 * Run: node scripts/run-migration.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

// Step 1: create exec_sql function via pg_net or direct REST call to /sql endpoint
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text;
}

// Bootstrap exec_sql via the query endpoint that Supabase exposes at /pg
async function bootstrapExecSQL() {
  const createFn = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN EXECUTE sql; END; $$;
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
  `;

  // Try via /pg/query (Supabase Studio API — only available locally or via Studio token)
  // Instead use a known-working approach: insert into a table to trigger a function
  // Best fallback: try the Supabase pg REST endpoint
  const res = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: createFn })
  });
  const txt = await res.text();
  console.log('bootstrap result:', res.status, txt.slice(0, 200));
}

const MIGRATIONS = [
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_profile boolean NOT NULL DEFAULT false`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS is_test_profile boolean NOT NULL DEFAULT false`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS price_per_acre numeric`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS road_access text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS utilities text[]`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS financing text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS target_state text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS target_county text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS target_city text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS target_zip text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS use_case_description text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS specific_requirements text`,
  `ALTER TABLE public.buyer_requests ADD COLUMN IF NOT EXISTS state text`,
  `ALTER TABLE public.buyer_requests ALTER COLUMN status SET DEFAULT 'active'`,
];

await bootstrapExecSQL();

for (const sql of MIGRATIONS) {
  try {
    await runSQL(sql);
    console.log('✅', sql.slice(0, 70));
  } catch (e) {
    console.error('❌', sql.slice(0, 70), '\n  ', e.message.slice(0, 200));
  }
}
