import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const CSV_PATH = process.argv[2];
if (!CSV_PATH) throw new Error('Usage: node scripts/import-fb-review-listings.mjs <csv-path>');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

// Seed/import owner used by earlier LotScout data imports.
const SEED_USER = process.env.LOTSCOUT_IMPORT_USER_ID || '257b51d6-cd33-4611-b2ca-c509f1ee6ac6';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function decodeEscaped(value = '') {
  if (!value) return '';
  try {
    return JSON.parse(`"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\\\\u/g, '\\u').replace(/\\\\n/g, '\\n')}"`);
  } catch {
    try { return Buffer.from(String(value), 'utf8').toString('utf8'); } catch { return String(value); }
  }
}

function cleanText(value = '') {
  return decodeEscaped(value)
    .replace(/Commenting has been turned off for this post\..*$/is, '')
    .replace(/Anyone can see who's in the group and what they post\./gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function num(value) {
  const s = String(value ?? '').replace(/[$,\s]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function bool(value) {
  return ['true', 'yes', '1'].includes(String(value ?? '').trim().toLowerCase());
}

function normalizeAskingPrice(input, lotSizeAcres) {
  const price = input === null || input === undefined || input === '' ? null : Number(input);
  if (!Number.isFinite(price) || price <= 0) return price === 0 ? 0 : null;
  const acres = lotSizeAcres === null || lotSizeAcres === undefined || lotSizeAcres === '' ? null : Number(lotSizeAcres);
  if (!Number.isFinite(acres) || acres <= 0) return Math.round(price);
  return price < 5000 ? Math.round(price * acres) : Math.round(price);
}

function arr(value) {
  return String(value ?? '').split('|').map(s => s.trim()).filter(Boolean);
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function titleCaseCity(s) {
  return String(s ?? '')
    .replace(/\b(in|near)\b.*$/i, '')
    .replace(/\bTX\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function extractAcres(text) {
  const m = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:acres?|acre)\b/i);
  return m ? Number(m[1]) : null;
}

function titleFor(r, desc) {
  const acres = num(r.lot_size_acres) || extractAcres(desc);
  const county = cleanText(r.county).replace(/\s+County$/i, '');
  const city = cleanText(r.city);
  const state = cleanText(r.state);
  const loc = [city, county && !city.toLowerCase().includes(county.toLowerCase()) ? `${county} County` : '', state].filter(Boolean).join(', ');
  const ac = acres ? `${acres.toLocaleString(undefined, { maximumFractionDigits: 2 })} Acre${acres === 1 ? '' : 's'}` : 'Land';
  return loc ? `${ac} in ${loc}` : cleanText(r.title).slice(0, 120) || 'Land Listing';
}

function normalizeRow(r) {
  const rawDesc = cleanText(r.raw_post_text || r.title);
  let acres = num(r.lot_size_acres);
  let sqft = num(r.lot_size_sqft);
  let city = titleCaseCity(cleanText(r.city));
  let county = cleanText(r.county).replace(/\s+County$/i, '');
  let zip = cleanText(r.zip_code);
  const state = cleanText(r.state).toUpperCase();
  const sourceUrl = cleanText(r.post_url_canonical || r.post_url);

  // Fix obvious extraction mistakes in this scrape batch.
  if (sourceUrl.includes('3680007825498842')) { acres = 4.55; sqft = Math.round(acres * 43560); city = 'Lecanto'; county = 'Citrus'; zip = '34461'; }
  if (sourceUrl.includes('3580513982114894')) { city = 'Beverly Hills'; county = 'Los Angeles'; zip = '90210'; }
  if (sourceUrl.includes('3681634548669503')) { city = 'Albany'; }
  if (sourceUrl.includes('1602627684637405')) { city = 'Brady'; county = 'McCulloch'; zip = '76825'; }
  if (sourceUrl.includes('1500475694852605')) { city = 'Deming'; county = 'Luna'; }
  if (sourceUrl.includes('1597127078520799')) { city = 'Frankfort'; county = 'Will'; zip = '60423'; }
  if (sourceUrl.includes('1540545284178979')) { city = 'Covington County'; county = 'Covington'; }

  if (!sqft && acres) sqft = Math.round(acres * 43560);

  const phones = unique(arr(r.contact_methods).map(v => v.replace(/^\(?([0-9]{3})\)?\s*/, '($1) ')));
  const contactMethods = phones.length ? unique(['Phone', 'Text', ...phones]) : ['LotScout Messaging'];
  const descParts = [rawDesc];
  if (phones.length) descParts.push(`Seller contact from source post: ${phones.join(', ')}`);

  return {
    user_id: SEED_USER,
    status: 'active',
    ownership_type: 'unknown',
    ownership_certified: false,
    title: titleFor({ ...r, city, county, state, lot_size_acres: acres }, rawDesc),
    property_description: descParts.filter(Boolean).join('\n\n'),
    city: city || 'Unknown',
    state: state || '',
    county: county || '',
    zip_code: zip || '',
    street_address: cleanText(r.street_address) || null,
    apn: cleanText(r.apn) || null,
    lot_size_acres: acres,
    lot_size_sqft: sqft,
    zoning: cleanText(r.zoning) || '',
    road_access: arr(r.road_access),
    utilities: arr(r.utilities),
    asking_price: normalizeAskingPrice(num(r.asking_price) ?? 0, acres),
    price_negotiable: bool(r.price_negotiable),
    owner_financing: bool(r.owner_financing),
    contact_methods: contactMethods,
    // The Facebook scrape can mix actual listing images with profile avatars,
    // group icons, and other people photos. Do not import scraped FB image URLs
    // until we have a reliable property-image classifier/permanence pipeline.
    photos_urls: [],
    source_url: sourceUrl,
    owner_name: cleanText(r.poster_name) || 'Facebook Seller',
    legal_confirmation: false,
    platform_understanding: false,
    state_compliance: false,
    digital_signature: cleanText(r.poster_name) || 'Imported Facebook Seller',
    signature_date: new Date().toISOString().slice(0, 10),
    // Keep import provenance in source_url only; additional_information is
    // rendered on listing pages and must not expose internal scrape metadata.
    additional_information: null,
  };
}

const raw = readFileSync(CSV_PATH, 'utf8');
const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
const records = rows.map(normalizeRow).filter(r => r.source_url);

const urls = records.map(r => r.source_url);
const { data: existing, error: existingError } = await sb
  .from('listings')
  .select('source_url')
  .in('source_url', urls);
if (existingError) throw existingError;
const existingUrls = new Set((existing ?? []).map(r => r.source_url));
const toInsert = records.filter(r => !existingUrls.has(r.source_url));

console.log(JSON.stringify({ csvRows: rows.length, normalized: records.length, existing: existingUrls.size, toInsert: toInsert.length }, null, 2));
for (const r of toInsert) console.log(`- ${r.title} | $${r.asking_price?.toLocaleString?.() ?? r.asking_price} | ${r.source_url}`);

if (toInsert.length) {
  const { data, error } = await sb.from('listings').insert(toInsert).select('id,title,source_url');
  if (error) throw error;
  console.log('\nInserted:');
  for (const row of data ?? []) console.log(`${row.id} | ${row.title}`);
}

const { data: verify, error: verifyError } = await sb
  .from('listings')
  .select('id,title,city,state,county,lot_size_acres,asking_price,source_url,created_at')
  .in('source_url', urls)
  .order('created_at', { ascending: false });
if (verifyError) throw verifyError;
console.log('\nVerified rows in LotScout:');
console.log(JSON.stringify(verify, null, 2));
