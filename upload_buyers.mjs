import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SEED_USER = '257b51d6-cd33-4611-b2ca-c509f1ee6ac6';

const raw = readFileSync('/Users/kingclaw/.openclaw/workspace/fb_buyers_with_names.csv', 'utf8');
const rows = parse(raw, { columns: true, skip_empty_lines: true });

const records = rows.map(r => ({
  buyer_id: SEED_USER,
  location: [r.county, r.state].filter(Boolean).join(', ') || null,
  min_acreage: r.lot_size_acres ? parseFloat(r.lot_size_acres) * 0.5 : null,
  max_acreage: r.lot_size_acres ? parseFloat(r.lot_size_acres) * 2 : null,
  min_budget: null,
  max_budget: r.asking_price ? parseFloat(r.asking_price) : null,
  land_type: 'vacant land',
}));

const { error } = await sb.from('buyer_criteria').insert(records);
if (error) console.log('Error:', error.message);
else console.log(`Buyers done: ${records.length} inserted`);
