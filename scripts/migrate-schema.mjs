import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

const migrations = [
  // profiles
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_profile boolean NOT NULL DEFAULT false`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text`,
  // buyer_requests
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

for (const sql of migrations) {
  const { error } = await supabase.rpc('exec_sql', { sql }).single().catch(() => ({ error: { message: 'rpc not available' } }));
  if (error) {
    // Fall back: try via REST raw query isn't available without pg access
    console.log(`⚠️  RPC unavailable — will use migration file approach`);
    break;
  }
  console.log('✅', sql.slice(0, 60));
}
