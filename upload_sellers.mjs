import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const sb = createClient(
  'https://axiockuobpttlwzicldo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk'
);

const SEED_USER = '257b51d6-cd33-4611-b2ca-c509f1ee6ac6';

const raw = readFileSync('/Users/kingclaw/.openclaw/workspace/fb_sellers_with_names.csv', 'utf8');
const rows = parse(raw, { columns: true, skip_empty_lines: true });

const records = rows.map(r => ({
  user_id: SEED_USER,
  title: r.title || null,
  state: r.state || null,
  county: r.county || null,
  zip_code: r.zip_code || null,
  street_address: r.street_address || null,
  apn: r.apn || null,
  lot_size_acres: r.lot_size_acres ? parseFloat(r.lot_size_acres) : null,
  zoning: r.zoning || null,
  road_access: r.road_access ? r.road_access.split('|').filter(Boolean) : [],
  utilities: r.utilities ? r.utilities.split('|').filter(Boolean) : [],
  asking_price: r.asking_price ? parseFloat(r.asking_price) : null,
  price_negotiable: r.price_negotiable === 'true' || r.price_negotiable === 'Yes',
  property_description: r.property_description || null,
  photos_urls: r.photos_urls ? r.photos_urls.split('|').filter(Boolean) : [],
  status: 'active',
}));

const BATCH = 50;
let inserted = 0, errors = 0;
for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const { error } = await sb.from('listings').insert(batch);
  if (error) { console.log(`Batch ${i}-${i+BATCH} error:`, error.message); errors++; }
  else inserted += batch.length;
}
console.log(`Sellers done: ${inserted} inserted, ${errors} batch errors`);
