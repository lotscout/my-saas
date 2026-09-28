import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(file) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile('/tmp/lotscout-dev.env');

const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
if (!ATTOM_API_KEY || ATTOM_API_KEY === '[SENSITIVE]') throw new Error('ATTOM_API_KEY is required');

const ATTOM_BASE = process.env.ATTOM_BASE_URL || 'https://api.gateway.attomdata.com';
const OUT_DIR = path.join(process.cwd(), 'exports');

const DENVER_ZIPS = [
  '80202','80203','80204','80205','80206','80207','80209','80210','80211','80212','80216','80218','80219','80220','80221','80222','80223','80224','80227','80230','80231','80236','80237','80238','80239','80246','80247','80249','80264','80290','80293','80294'
];

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function attom(pathname, params) {
  const url = new URL(ATTOM_BASE + pathname);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const response = await fetch(url, { headers: { accept: 'application/json', apikey: ATTOM_API_KEY } });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  const statusPayload = data?.status || data || text;
  const statusMsg = String(data?.status?.msg || data?.status?.code || data?.status || '');
  if (response.status === 400 && /SuccessWithoutResult/i.test(statusMsg)) return { status: data?.status || { total: 0 }, property: [] };
  if (!response.ok || data?.status?.code >= 400) {
    throw new Error(`ATTOM ${pathname} failed: ${response.status} ${JSON.stringify(statusPayload).slice(0, 300)}`);
  }
  return data;
}

function pick(...values) {
  return values.find(v => v !== undefined && v !== null && v !== '') ?? '';
}
function num(value) {
  if (value === undefined || value === null || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : '';
}
function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows, headers) {
  return [headers.join(','), ...rows.map(row => headers.map(h => csvEscape(row[h])).join(','))].join('\n');
}

function normalizeSearchProperty(p, zip) {
  const id = p.identifier || {};
  const address = p.address || {};
  const summary = p.summary || {};
  const lot = p.lot || {};
  const assessment = p.assessment || {};
  const owner = assessment.owner || p.owner || {};
  const sale = p.sale || {};
  const saleAmount = sale.amount || {};
  return {
    attom_id: String(pick(id.attomId, id.Id, id.id)),
    apn: pick(id.apn, id.apnOrig),
    address: pick(address.oneLine, [address.line1, address.line2].filter(Boolean).join(', ')),
    city: pick(address.locality, 'Denver'),
    state: pick(address.countrySubd, 'CO'),
    zip: pick(address.postal1, zip),
    latitude: num(p.location?.latitude),
    longitude: num(p.location?.longitude),
    property_type: pick(summary.propType, summary.propertyType, summary.propClass),
    land_use: pick(summary.propLandUse, summary.propSubType, summary.propertyType, 'Vacant land'),
    zoning: pick(lot.siteZoningIdent, lot.zoningType),
    lot_sqft: num(pick(lot.lotSize2, lot.lotsize2)),
    lot_acres: num(pick(lot.lotSize1, lot.lotsize1)),
    owner_name: pick(owner.owner1?.fullName, owner.owner1?.fullname, owner.owner1?.lastName, owner.owner1?.lastname),
    owner_mailing_address: pick(owner.mailingAddressOneLine, owner.mailingaddressoneline),
    assessed_total: num(pick(assessment.assessed?.assdTtlValue, assessment.market?.mktTtlValue)),
    assessed_land: num(pick(assessment.assessed?.assdLandValue, assessment.market?.mktLandValue)),
    last_sale_price: num(saleAmount.saleAmt),
    last_sale_date: pick(sale.saleTransDate, sale.saleSearchDate, saleAmount.saleRecDate),
    source_zip: zip,
  };
}

async function fetchAllSearchRows({ detail = false, pagesize = 100 }) {
  const rows = [];
  const seen = new Set();
  const counts = [];
  for (const postalcode of DENVER_ZIPS) {
    let page = 1;
    let total = null;
    let zipRows = 0;
    while (true) {
      const data = await attom('/propertyapi/v1.0.0/property/address', { postalcode, propertytype: 'VACANT LAND', page, pagesize });
      const properties = data.property || [];
      total = data.status?.total ?? total;
      if (page === 1) console.log(`${postalcode}: total=${total ?? 'unknown'} firstPage=${properties.length}`);
      for (const property of properties) {
        const row = normalizeSearchProperty(property, postalcode);
        if (!row.attom_id || seen.has(row.attom_id)) continue;
        seen.add(row.attom_id);
        rows.push(row);
        zipRows += 1;
      }
      const returned = properties.length;
      if (!returned || returned < pagesize) break;
      if (total && page * pagesize >= Number(total)) break;
      page += 1;
      await sleep(120);
    }
    counts.push({ zip: postalcode, total: total ?? zipRows, unique_imported: zipRows });
    await sleep(180);
  }
  return { rows, counts };
}

await fs.promises.mkdir(OUT_DIR, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const { rows, counts } = await fetchAllSearchRows({ pagesize: 100 });
const headers = ['attom_id','apn','address','city','state','zip','latitude','longitude','property_type','land_use','zoning','lot_sqft','lot_acres','owner_name','owner_mailing_address','assessed_total','assessed_land','last_sale_price','last_sale_date','source_zip'];
const csvPath = path.join(OUT_DIR, `attom-denver-vacant-lots-${stamp}.csv`);
const jsonPath = path.join(OUT_DIR, `attom-denver-vacant-lots-${stamp}.json`);
const countsPath = path.join(OUT_DIR, `attom-denver-vacant-lots-counts-${stamp}.csv`);
await fs.promises.writeFile(csvPath, toCsv(rows, headers));
await fs.promises.writeFile(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), source: 'ATTOM /property/address propertytype=VACANT LAND by Denver ZIP', zips: DENVER_ZIPS, counts, rows }, null, 2));
await fs.promises.writeFile(countsPath, toCsv(counts, ['zip','total','unique_imported']));
console.log(JSON.stringify({ rows: rows.length, csvPath, jsonPath, countsPath }, null, 2));
