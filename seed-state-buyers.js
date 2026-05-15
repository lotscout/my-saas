// seed-state-buyers.js
// 1. Deletes all fake state buyers (keeps national buyers where target_state IS NULL)
// 2. Seeds 40 verified state buyers from butterflymx.com/blog/top-50-property-developers-by-state/

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://axiockuobpttlwzicldo.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aW9ja3VvYnB0dGx3emljbGRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxNjk2NCwiZXhwIjoyMDkxNTkyOTY0fQ.PLW0Zjnu-KmlT6fE57j1EzkEj3a2fnHaFEUVyiwUTuk';
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

// Real verified buyers — source: butterflymx.com/blog/top-50-property-developers-by-state/
const STATE_BUYERS = [
  { target_state: 'AL', display_company: 'Capstone Communities',           contact_website: 'capstone-communities.com',   use_case: 'Residential Development' },
  { target_state: 'AK', display_company: 'Cook Inlet Housing Authority',   contact_website: 'cookinlethousing.org',        use_case: 'Residential Development' },
  { target_state: 'AZ', display_company: 'Mark-Taylor Development',        contact_website: 'mark-taylor.com',            use_case: 'Residential Development' },
  { target_state: 'AR', display_company: 'Specialized Real Estate Group',  contact_website: 'specializedreg.com',         use_case: 'Mixed Use' },
  { target_state: 'CA', display_company: 'Related California',             contact_website: 'relatedcalifornia.com',      use_case: 'Residential Development' },
  { target_state: 'CO', display_company: 'McWhinney',                      contact_website: 'mcwhinney.com',              use_case: 'Mixed Use' },
  { target_state: 'CT', display_company: 'RMS Companies',                  contact_website: 'rms-companies.com',          use_case: 'Residential Development' },
  { target_state: 'DE', display_company: 'The Buccini/Pollin Group',       contact_website: 'bpgroup.net',                use_case: 'Mixed Use' },
  { target_state: 'FL', display_company: 'FCI Residential',                contact_website: 'fciresidential.com',         use_case: 'Residential Development' },
  { target_state: 'GA', display_company: 'Wood Partners',                  contact_website: 'woodpartners.com',           use_case: 'Residential Development' },
  { target_state: 'HI', display_company: 'Howard Hughes Corp (Ward Village)', contact_website: 'wardvillage.com',         use_case: 'Mixed Use' },
  { target_state: 'ID', display_company: 'Roundhouse',                     contact_website: 'rndhouse.com',               use_case: 'Residential Development' },
  { target_state: 'IL', display_company: 'Related Midwest',                contact_website: 'relatedmidwest.com',         use_case: 'Mixed Use' },
  { target_state: 'IN', display_company: 'Milhaus',                        contact_website: 'milhaus.com',                use_case: 'Residential Development' },
  { target_state: 'IA', display_company: 'Hubbell Realty Company',         contact_website: 'hubbellrealty.com',          use_case: 'Mixed Use' },
  { target_state: 'KS', display_company: 'EPC Real Estate Group',          contact_website: 'epcrealestate.com',          use_case: 'Mixed Use' },
  { target_state: 'KY', display_company: 'LDG Development',                contact_website: 'ldgdevelopment.com',         use_case: 'Residential Development' },
  { target_state: 'LA', display_company: 'The Domain Companies',           contact_website: 'thedomaincos.com',           use_case: 'Mixed Use' },
  { target_state: 'ME', display_company: 'The Szanton Company',            contact_website: 'szantoncompany.com',         use_case: 'Mixed Use' },
  { target_state: 'MD', display_company: 'Bozzuto Development Company',    contact_website: 'bozzuto.com',                use_case: 'Mixed Use' },
  { target_state: 'MA', display_company: 'Trinity Financial',              contact_website: 'trinityfinancial.com',       use_case: 'Mixed Use' },
  { target_state: 'MI', display_company: 'Bedrock',                        contact_website: 'bedrockdetroit.com',         use_case: 'Commercial' },
  { target_state: 'MN', display_company: 'Ryan Companies',                 contact_website: 'ryancompanies.com',          use_case: 'Mixed Use' },
  { target_state: 'MS', display_company: 'StateStreet Group',              contact_website: 'statestreetgroup.com',       use_case: 'Residential Development' },
  { target_state: 'MO', display_company: 'McCormack Baron Salazar',        contact_website: 'mccormackbaron.com',         use_case: 'Mixed Use' },
  { target_state: 'MT', display_company: 'BlueLine Development',           contact_website: 'bluelinedevelopment.com',    use_case: 'Residential Development' },
  { target_state: 'NE', display_company: 'Bluestone Development',          contact_website: 'bluestonedev.com',           use_case: 'Mixed Use' },
  { target_state: 'NV', display_company: 'The Calida Group',               contact_website: 'thecalidagroup.com',         use_case: 'Residential Development' },
  { target_state: 'NH', display_company: 'Brady Sullivan Properties',      contact_website: 'bradysullivan.com',          use_case: 'Mixed Use' },
  { target_state: 'NJ', display_company: 'KRE Group',                      contact_website: 'thekregroup.com',            use_case: 'Mixed Use' },
  { target_state: 'NM', display_company: 'Titan Development',              contact_website: 'titan-development.com',      use_case: 'Mixed Use' },
  { target_state: 'NY', display_company: 'L+M Development Partners',       contact_website: 'lmdevpartners.com',          use_case: 'Mixed Use' },
  { target_state: 'NC', display_company: 'Crescent Communities',           contact_website: 'crescentcommunities.com',    use_case: 'Mixed Use' },
  { target_state: 'ND', display_company: 'Roers',                          contact_website: 'roers.com',                  use_case: 'Residential Development' },
  { target_state: 'OH', display_company: 'The NRP Group',                  contact_website: 'nrpgroup.com',               use_case: 'Residential Development' },
  { target_state: 'OK', display_company: 'American Residential Group',     contact_website: 'argtulsa.com',               use_case: 'Residential Development' },
  { target_state: 'OR', display_company: 'Guardian Real Estate Services',  contact_website: 'gres.com',                   use_case: 'Residential Development' },
  { target_state: 'PA', display_company: 'Post Brothers',                  contact_website: 'postrents.com',              use_case: 'Residential Development' },
  { target_state: 'RI', display_company: 'Cornish Associates',             contact_website: 'cornishassociates.com',      use_case: 'Mixed Use' },
  { target_state: 'SC', display_company: 'The Beach Company',              contact_website: 'thebeachcompany.com',        use_case: 'Mixed Use' },
  // SD–WY to be added when source provided
];

async function run() {
  // Step 1: Delete all state buyers (keep nationals where target_state IS NULL)
  console.log('Deleting fake state buyers...');
  const { error: delErr, count } = await sb
    .from('buyer_requests')
    .delete({ count: 'exact' })
    .not('target_state', 'is', null);

  if (delErr) { console.error('Delete error:', delErr); return; }
  console.log(`Deleted ${count} state buyers.`);

  // Step 2: Get seed user
  const { data: { users } } = await sb.auth.admin.listUsers({ page: 1, perPage: 100 });
  const seedUser = users?.find(u => u.email === 'seed-buyers@lotscout.com');
  if (!seedUser) { console.error('Seed user not found'); return; }
  const userId = seedUser.id;

  // Step 3: Insert real state buyers
  const rows = STATE_BUYERS.map(b => ({
    user_id: userId,
    display_name: b.display_company,
    display_company: b.display_company,
    contact_website: b.contact_website,
    target_state: b.target_state,
    target_regions: [b.target_state],
    use_case: b.use_case,
    timeline: 'Actively Buying (0–30 days)',
    status: 'active',
  }));

  const { error: insertErr } = await sb.from('buyer_requests').insert(rows);
  if (insertErr) { console.error('Insert error:', insertErr); return; }

  console.log(`Inserted ${rows.length} verified state buyers.`);

  // Final count
  const { count: total } = await sb.from('buyer_requests').select('id', { count: 'exact', head: true });
  console.log(`Total buyer_requests now: ${total}`);
}

run().catch(console.error);
