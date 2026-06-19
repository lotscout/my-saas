// seed-state-buyers.js
// Enriches the existing seeded state buyers with realistic target_cities and
// lot-size preferences. Update-in-place (matched by display_company + target_state),
// non-destructive — safe and idempotent to re-run. Requires the columns from
// supabase/migrations/20260619010000_add_buyer_request_cities_lotsize.sql.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk';
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

const lot = (min, max) => ({ min, max, label: `${min} to ${max} acres` });

// Real verified buyers — source: butterflymx.com/blog/top-50-property-developers-by-state/
// cities: 2–3 real major cities in the buyer's state. lot: realistic acreage range.
const STATE_BUYERS = [
  { target_state: 'AL', display_company: 'Capstone Communities',           cities: 'Birmingham, Montgomery, Huntsville',  lot: lot(1, 10) },
  { target_state: 'AK', display_company: 'Cook Inlet Housing Authority',   cities: 'Anchorage, Fairbanks, Wasilla',       lot: lot(1, 5) },
  { target_state: 'AZ', display_company: 'Mark-Taylor Development',        cities: 'Phoenix, Scottsdale, Tempe',          lot: lot(5, 25) },
  { target_state: 'AR', display_company: 'Specialized Real Estate Group',  cities: 'Little Rock, Fayetteville, Bentonville', lot: lot(5, 20) },
  { target_state: 'CA', display_company: 'Related California',             cities: 'Los Angeles, San Francisco, San Diego', lot: lot(1, 10) },
  { target_state: 'CO', display_company: 'McWhinney',                      cities: 'Denver, Colorado Springs, Aurora',    lot: lot(5, 50) },
  { target_state: 'CT', display_company: 'RMS Companies',                  cities: 'Stamford, New Haven, Hartford',       lot: lot(1, 10) },
  { target_state: 'DE', display_company: 'The Buccini/Pollin Group',       cities: 'Wilmington, Dover, Newark',           lot: lot(1, 10) },
  { target_state: 'FL', display_company: 'FCI Residential',                cities: 'Miami, Orlando, Tampa',               lot: lot(5, 50) },
  { target_state: 'GA', display_company: 'Wood Partners',                  cities: 'Atlanta, Savannah, Augusta',          lot: lot(5, 50) },
  { target_state: 'HI', display_company: 'Howard Hughes Corp (Ward Village)', cities: 'Honolulu, Kapolei, Kailua',        lot: lot(1, 10) },
  { target_state: 'ID', display_company: 'Roundhouse',                     cities: 'Boise, Meridian, Nampa',              lot: lot(5, 40) },
  { target_state: 'IL', display_company: 'Related Midwest',                cities: 'Chicago, Naperville, Aurora',         lot: lot(1, 10) },
  { target_state: 'IN', display_company: 'Milhaus',                        cities: 'Indianapolis, Fort Wayne, Carmel',    lot: lot(5, 30) },
  { target_state: 'IA', display_company: 'Hubbell Realty Company',         cities: 'Des Moines, Cedar Rapids, Davenport', lot: lot(10, 80) },
  { target_state: 'KS', display_company: 'EPC Real Estate Group',          cities: 'Kansas City, Overland Park, Wichita', lot: lot(10, 100) },
  { target_state: 'KY', display_company: 'LDG Development',                cities: 'Louisville, Lexington, Bowling Green', lot: lot(5, 40) },
  { target_state: 'LA', display_company: 'The Domain Companies',           cities: 'New Orleans, Baton Rouge, Lafayette', lot: lot(5, 30) },
  { target_state: 'ME', display_company: 'The Szanton Company',            cities: 'Portland, Lewiston, Bangor',          lot: lot(5, 40) },
  { target_state: 'MD', display_company: 'Bozzuto Development Company',    cities: 'Baltimore, Columbia, Silver Spring',  lot: lot(1, 15) },
  { target_state: 'MA', display_company: 'Trinity Financial',              cities: 'Boston, Worcester, Cambridge',        lot: lot(1, 10) },
  { target_state: 'MI', display_company: 'Bedrock',                        cities: 'Detroit, Grand Rapids, Ann Arbor',    lot: lot(1, 20) },
  { target_state: 'MN', display_company: 'Ryan Companies',                 cities: 'Minneapolis, St. Paul, Rochester',    lot: lot(5, 40) },
  { target_state: 'MS', display_company: 'StateStreet Group',              cities: 'Jackson, Gulfport, Southaven',        lot: lot(10, 60) },
  { target_state: 'MO', display_company: 'McCormack Baron Salazar',        cities: 'St. Louis, Kansas City, Springfield', lot: lot(5, 40) },
  { target_state: 'MT', display_company: 'BlueLine Development',           cities: 'Billings, Missoula, Bozeman',         lot: lot(20, 160) },
  { target_state: 'NE', display_company: 'Bluestone Development',          cities: 'Omaha, Lincoln, Bellevue',            lot: lot(10, 100) },
  { target_state: 'NV', display_company: 'The Calida Group',               cities: 'Las Vegas, Henderson, Reno',          lot: lot(5, 40) },
  { target_state: 'NH', display_company: 'Brady Sullivan Properties',      cities: 'Manchester, Nashua, Concord',         lot: lot(5, 30) },
  { target_state: 'NJ', display_company: 'KRE Group',                      cities: 'Newark, Jersey City, Hoboken',        lot: lot(1, 10) },
  { target_state: 'NM', display_company: 'Titan Development',              cities: 'Albuquerque, Santa Fe, Las Cruces',   lot: lot(10, 80) },
  { target_state: 'NY', display_company: 'L+M Development Partners',       cities: 'New York, Brooklyn, Buffalo',         lot: lot(1, 10) },
  { target_state: 'NC', display_company: 'Crescent Communities',           cities: 'Charlotte, Raleigh, Durham',          lot: lot(5, 50) },
  { target_state: 'ND', display_company: 'Roers',                          cities: 'Fargo, Bismarck, Grand Forks',        lot: lot(20, 120) },
  { target_state: 'OH', display_company: 'The NRP Group',                  cities: 'Columbus, Cleveland, Cincinnati',     lot: lot(5, 40) },
  { target_state: 'OK', display_company: 'American Residential Group',     cities: 'Oklahoma City, Tulsa, Norman',        lot: lot(10, 80) },
  { target_state: 'OR', display_company: 'Guardian Real Estate Services',  cities: 'Portland, Eugene, Salem',             lot: lot(5, 40) },
  { target_state: 'PA', display_company: 'Post Brothers',                  cities: 'Philadelphia, Pittsburgh, Allentown', lot: lot(1, 20) },
  { target_state: 'RI', display_company: 'Cornish Associates',             cities: 'Providence, Warwick, Cranston',       lot: lot(1, 10) },
  { target_state: 'SC', display_company: 'The Beach Company',              cities: 'Charleston, Columbia, Greenville',    lot: lot(5, 40) },
];

async function run() {
  let updated = 0;
  for (const b of STATE_BUYERS) {
    const { error, count } = await sb
      .from('buyer_requests')
      .update(
        {
          target_cities: b.cities,
          lot_size_min: b.lot.min,
          lot_size_max: b.lot.max,
          lot_size_label: b.lot.label,
        },
        { count: 'exact' }
      )
      .eq('display_company', b.display_company)
      .eq('target_state', b.target_state);

    if (error) {
      if (/target_cities|lot_size_(min|max|label)/i.test(error.message)) {
        console.error('\nColumns target_cities / lot_size_* do not exist yet.');
        console.error('Apply supabase/migrations/20260619010000_add_buyer_request_cities_lotsize.sql, then re-run this script.');
        return;
      }
      console.error(`Update error for ${b.display_company}:`, error.message);
      continue;
    }
    updated += count ?? 0;
  }

  console.log(`Updated ${updated} buyer rows with target_cities + lot size.`);

  const { data } = await sb
    .from('buyer_requests')
    .select('display_company, target_state, target_cities, lot_size_label')
    .not('target_cities', 'is', null)
    .limit(10);
  console.log('Sample:');
  console.table(data ?? []);
}

run().catch(console.error);
