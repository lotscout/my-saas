const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'buyer_profiles_seed.csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').slice(1).filter(l => l.trim());

const values = [];
for (const line of lines) {
  // Split on comma, but CSV uses semicolons inside fields, so simple split is OK
  const cols = line.split(',');
  if (cols.length < 11) continue;
  const firstName = cols[1]?.trim();
  const lastName = cols[2]?.trim();
  const company = cols[3]?.trim();
  const budMin = parseInt(cols[6], 10);
  const budMax = parseInt(cols[7], 10);
  const acreMin = parseInt(cols[9], 10);

  if (!firstName || isNaN(budMin) || isNaN(budMax) || isNaN(acreMin)) continue;

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const companyVal = company ? `'${company.replace(/'/g, "''")}'` : 'NULL';
  const nameVal = `'${fullName.replace(/'/g, "''")}'`;

  values.push(`(${budMin}, ${budMax}, ${acreMin}, ${companyVal}, ${nameVal})`);
}

const sql = `
UPDATE buyer_requests AS br
SET
  display_company = v.company,
  display_name    = v.name
FROM (VALUES
  ${values.join(',\n  ')}
) AS v(budget_min, budget_max, min_acreage, company, name)
WHERE br.budget_min  = v.budget_min
  AND br.budget_max  = v.budget_max
  AND br.min_acreage = v.min_acreage;
`;

console.log(sql);
console.log(`-- Total rows in VALUES: ${values.length}`);
