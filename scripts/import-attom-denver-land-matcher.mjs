import { createClient } from '@supabase/supabase-js';
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase env vars are required');
if (!ATTOM_API_KEY) throw new Error('ATTOM_API_KEY is required');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const ATTOM_BASE = process.env.ATTOM_BASE_URL || 'https://api.gateway.attomdata.com';

const DENVER_ZIPS = [
  '80202','80203','80204','80205','80206','80207','80209','80210','80211','80212','80216','80218','80219','80220','80221','80222','80223','80224','80227','80230','80231','80236','80237','80238','80239','80246','80247','80249','80264','80290','80293','80294'
];

const DEFAULT_BUYERS = [
  {
    company: 'Denver Infill Builders', contact_name: 'Acquisitions', market: 'Denver infill',
    neighborhoods: ['Sunnyside','Berkeley','Highland','West Highland','Sloan Lake','West Colfax'],
    zoning: ['U-SU-C','U-SU-B','U-TU-B','U-TU-B2','U-RH-2.5','G-MU-3'],
    min_lot_sqft: 3000, max_lot_sqft: 9000, max_price: 750000, build_type: 'infill residential lots', status: 'active',
    notes: 'General Denver infill buyer profile seeded for ATTOM matching.'
  },
  {
    company: 'Denver Duplex/Townhome Buyers', contact_name: 'Land Buyer', market: 'Denver density lots',
    neighborhoods: ['Sloan Lake','West Colfax','Villa Park','Barnum','Baker','Capitol Hill','Five Points'],
    zoning: ['G-MU-3','U-RH-2.5','U-MX-3','C-MX-3','E-TU-C','U-TU-B2'],
    min_lot_sqft: 4500, max_lot_sqft: 14000, max_price: 1200000, build_type: 'duplex, townhome, and small multifamily lots', status: 'active',
    notes: 'Density-oriented Denver buyer profile seeded for ATTOM matching.'
  },
  {
    company: 'Entry-Level Denver SFR Buyers', contact_name: 'Owner', market: 'Affordable Denver lots',
    neighborhoods: ['Globeville','Elyria Swansea','Montbello','Ruby Hill','Harvey Park','Athmar Park','Westwood'],
    zoning: ['E-SU-DX','E-SU-D1X','U-SU-C','S-SU-D'],
    min_lot_sqft: 3000, max_lot_sqft: 9500, max_price: 425000, build_type: 'entry-level single-family lots', status: 'active',
    notes: 'Lower basis lots for simpler single-family build paths.'
  }
];

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function attom(pathname, params) {
  const url = new URL(ATTOM_BASE + pathname);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const response = await fetch(url, { headers: { accept: 'application/json', apikey: ATTOM_API_KEY } });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status?.code >= 400) throw new Error(`ATTOM ${pathname} failed: ${response.status} ${JSON.stringify(data?.status || data).slice(0, 200)}`);
  return data;
}

function num(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ownerType(owner = {}) {
  const raw = [owner.type, owner.description, owner.corporateIndicator, owner.owner1?.fullName, owner.owner1?.lastName].join(' ').toUpperCase();
  if (raw.includes('TRUST')) return 'Trust';
  if (raw.includes('LLC') || raw.includes('COMPANY') || raw.includes('CORP') || raw.includes('INC')) return raw.includes('LLC') ? 'LLC' : 'Corporate';
  return 'Individual';
}

function yearsOwned(saleDate) {
  if (!saleDate) return null;
  const year = Number(String(saleDate).slice(0, 4));
  if (!Number.isFinite(year)) return null;
  return new Date().getFullYear() - year;
}

function neighborhoodFromProfile(p) {
  return p?.area?.subdName || p?.area?.countrySecSubd || 'Denver';
}

function normalize(profile) {
  const id = profile.identifier || {};
  const owner = profile.assessment?.owner || profile.owner || {};
  const sale = profile.sale || {};
  const saleAmount = sale.amount || {};
  const assessed = profile.assessment?.assessed || {};
  const market = profile.assessment?.market || {};
  const summary = profile.summary || {};
  const lot = profile.lot || {};
  const address = profile.address || {};
  const absenteeText = String(summary.absenteeInd || owner.absenteeOwnerStatus || '').toUpperCase();
  const mailing = owner.mailingAddressOneLine || owner.mailingaddressoneline || '';
  const ownerName = owner.owner1?.fullName || owner.owner1?.fullname || owner.owner1?.lastName || owner.owner1?.lastname || 'Unknown owner';
  const saleDate = sale.saleTransDate || sale.saleSearchDate || saleAmount.saleRecDate;
  const zip = address.postal1 || '';
  const flags = [];
  if (absenteeText.includes('ABSENTEE') || owner.absenteeOwnerStatus === 'A') flags.push('Absentee owner');
  if (mailing && !mailing.toUpperCase().includes('DENVER, CO')) flags.push('Mailing address outside Denver');
  if (ownerType(owner) !== 'Individual') flags.push(`${ownerType(owner)} owner`);
  if ((yearsOwned(saleDate) || 0) >= 10) flags.push('Long-term owner');
  if (summary.propClass || summary.propSubType) flags.push(summary.propSubType || summary.propClass);

  return {
    attom_id: id.attomId ? String(id.attomId) : null,
    apn: id.apn || id.apnOrig || null,
    address: address.oneLine || [address.line1, address.line2].filter(Boolean).join(', '),
    neighborhood: neighborhoodFromProfile(profile),
    city: 'Denver',
    state: 'CO',
    zip,
    owner_name: ownerName,
    owner_mailing_address: mailing,
    owner_type: ownerType(owner),
    absentee_owner: absenteeText.includes('ABSENTEE') || owner.absenteeOwnerStatus === 'A',
    out_of_state_owner: Boolean(mailing && !mailing.toUpperCase().includes(', CO')),
    lot_sqft: Math.round(num(lot.lotSize2 || lot.lotsize2) || 0) || null,
    zoning: lot.siteZoningIdent || lot.zoningType || null,
    land_use: summary.propLandUse || summary.propertyType || summary.propType || 'Vacant land',
    assessed_value: num(assessed.assdTtlValue || assessed.assdLandValue || market.mktTtlValue || market.mktLandValue),
    last_sale_price: num(saleAmount.saleAmt),
    last_sale_year: saleDate ? Number(String(saleDate).slice(0, 4)) : null,
    years_owned: yearsOwned(saleDate),
    tax_delinquent: false,
    lat: num(profile.location?.latitude),
    lng: num(profile.location?.longitude),
    flags,
    raw_attom: profile,
  };
}

async function seedBuyers() {
  for (const buyer of DEFAULT_BUYERS) {
    const { error } = await supabase.from('land_matcher_buyers').upsert(buyer, { onConflict: 'company' });
    if (error) throw error;
  }
}

async function importDenver({ maxProfiles = 300, pageSize = 25 } = {}) {
  await seedBuyers();
  const seen = new Set();
  const rows = [];

  for (const postalcode of DENVER_ZIPS) {
    if (rows.length >= maxProfiles) break;
    const search = await attom('/propertyapi/v1.0.0/property/address', { postalcode, propertytype: 'VACANT LAND', page: 1, pagesize: pageSize });
    const properties = search.property || [];
    console.log(`${postalcode}: ${properties.length} search results (total ${search.status?.total ?? 'unknown'})`);

    for (const property of properties) {
      if (rows.length >= maxProfiles) break;
      const attomId = property.identifier?.attomId || property.identifier?.Id;
      if (!attomId || seen.has(attomId)) continue;
      seen.add(attomId);
      try {
        const detail = await attom('/propertyapi/v1.0.0/property/expandedprofile', { attomid: attomId });
        const profile = detail.property?.[0];
        if (!profile) continue;
        const row = normalize(profile);
        if (!row.attom_id || !row.address) continue;
        rows.push(row);
        process.stdout.write('.');
        await sleep(80);
      } catch (error) {
        console.warn(`\nDetail failed for ${attomId}: ${error.message}`);
      }
    }
    console.log(` imported so far: ${rows.length}`);
  }

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from('land_matcher_parcels').upsert(batch, { onConflict: 'attom_id' });
    if (error) throw error;
  }

  console.log(`\nImported/upserted ${rows.length} real Denver ATTOM parcel profiles.`);
}

const max = Number(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1] || 300);
await importDenver({ maxProfiles: max });
