export type PropertyLead = {
  id: string;
  title: string;
  price: number;
  lotSize: string;
  acres: number;
  city: string;
  state: string;
  county: string;
  source: 'Zillow' | 'Redfin' | 'Land.com';
  sourceUrl: string;
  listedDate: string;
  sellerName: string;
  sellerCompany: string;
  sellerEmail: string;
  sellerPhone: string;
  zoning: string;
  roadAccess: string;
  utilities: string;
  propertyType: string;
  summary: string;
  highlights: string[];
  dueDiligence: string[];
};

export const MOCK_PROPERTY_LEADS: PropertyLead[] = [
  {
    id: 'austin-tx-024-acre-infill',
    title: '0.24 acres in Austin, TX',
    price: 115000,
    lotSize: '0.24 acres',
    acres: 0.24,
    city: 'Austin',
    state: 'TX',
    county: 'Travis',
    source: 'Zillow',
    sourceUrl: 'https://www.zillow.com/us/land/',
    listedDate: '2026-08-21',
    sellerName: 'Maria Santos',
    sellerCompany: 'Hill Country Land Group',
    sellerEmail: 'maria@example-land.com',
    sellerPhone: '(512) 555-0148',
    zoning: 'Residential infill',
    roadAccess: 'Paved public road',
    utilities: 'Power and water nearby; sewer to verify',
    propertyType: 'Residential lot',
    summary: 'Small infill lot in a fast-moving residential market. Best suited for a builder or investor who can verify setbacks, utility taps, and local buildability before offer.',
    highlights: ['Infill location', 'Paved access', 'Nearby residential development', 'Potential builder exit'],
    dueDiligence: ['Confirm zoning and setbacks', 'Verify utility tap fees', 'Check drainage/floodplain', 'Pull recent nearby lot comps'],
  },
  {
    id: 'denver-co-6250-sqft-lot',
    title: '6,250 sq ft in Denver, CO',
    price: 189000,
    lotSize: '6,250 sq ft',
    acres: 0.14,
    city: 'Denver',
    state: 'CO',
    county: 'Denver',
    source: 'Redfin',
    sourceUrl: 'https://www.redfin.com/city/5155/CO/Denver/land',
    listedDate: '2026-08-19',
    sellerName: 'Jason Miller',
    sellerCompany: 'Front Range Parcel Co.',
    sellerEmail: 'jason@example-land.com',
    sellerPhone: '(303) 555-0182',
    zoning: 'Urban residential',
    roadAccess: 'City street frontage',
    utilities: 'Urban utilities nearby; taps to verify',
    propertyType: 'City lot',
    summary: 'Urban residential lot with potential for an infill build. Price depends heavily on zoning interpretation, allowable density, and total site-work/tap costs.',
    highlights: ['City infill location', 'Strong resale market', 'Street frontage', 'Potential redevelopment play'],
    dueDiligence: ['Verify allowable structure type', 'Confirm alley/access requirements', 'Estimate tap and permit fees', 'Review title exceptions'],
  },
  {
    id: 'bend-or-191-acre-buildable',
    title: '1.91 acres in Bend, OR',
    price: 275000,
    lotSize: '1.91 acres',
    acres: 1.91,
    city: 'Bend',
    state: 'OR',
    county: 'Deschutes',
    source: 'Land.com',
    sourceUrl: 'https://www.land.com/',
    listedDate: '2026-08-17',
    sellerName: 'Avery Collins',
    sellerCompany: 'Cascade Land Advisors',
    sellerEmail: 'avery@example-land.com',
    sellerPhone: '(541) 555-0106',
    zoning: 'Rural residential',
    roadAccess: 'Gravel road',
    utilities: 'Power nearby; well/septic likely',
    propertyType: 'Buildable acreage',
    summary: 'Small acreage parcel near a high-demand recreation market. Likely attractive to custom-home buyers if access, septic feasibility, and water availability check out.',
    highlights: ['Lifestyle acreage', 'Strong buyer demand', 'Room for custom build', 'Recreation-market appeal'],
    dueDiligence: ['Confirm septic feasibility', 'Verify well depth/cost', 'Review road maintenance agreement', 'Check wildfire overlay rules'],
  },
  {
    id: 'phoenix-az-5000-sqft-lot',
    title: '5,000 sq ft in Phoenix, AZ',
    price: 72000,
    lotSize: '5,000 sq ft',
    acres: 0.11,
    city: 'Phoenix',
    state: 'AZ',
    county: 'Maricopa',
    source: 'Zillow',
    sourceUrl: 'https://www.zillow.com/us/land/',
    listedDate: '2026-08-15',
    sellerName: 'Nolan Price',
    sellerCompany: 'Desert Lots Direct',
    sellerEmail: 'nolan@example-land.com',
    sellerPhone: '(602) 555-0199',
    zoning: 'Residential',
    roadAccess: 'Paved road',
    utilities: 'Power nearby; water/sewer to verify',
    propertyType: 'Residential lot',
    summary: 'Entry-priced metro lot that may work for a builder, modular strategy, or hold. Verify city requirements and utility costs before underwriting margin.',
    highlights: ['Metro location', 'Lower entry price', 'Paved access', 'Potential starter build'],
    dueDiligence: ['Confirm utility connections', 'Review minimum building size', 'Check liens/taxes', 'Validate nearby new-build comps'],
  },
  {
    id: 'charlotte-nc-072-acre-lot',
    title: '0.72 acres in Charlotte, NC',
    price: 149500,
    lotSize: '0.72 acres',
    acres: 0.72,
    city: 'Charlotte',
    state: 'NC',
    county: 'Mecklenburg',
    source: 'Redfin',
    sourceUrl: 'https://www.redfin.com/',
    listedDate: '2026-08-13',
    sellerName: 'Keisha Grant',
    sellerCompany: 'Queen City Land Partners',
    sellerEmail: 'keisha@example-land.com',
    sellerPhone: '(704) 555-0117',
    zoning: 'Residential',
    roadAccess: 'Public road frontage',
    utilities: 'Municipal utilities likely nearby',
    propertyType: 'Residential acreage',
    summary: 'Sub-acre parcel in a growing Southeast market. Could appeal to local builders if topography and neighborhood resale values support the asking price.',
    highlights: ['Growing metro', 'Public frontage', 'Builder-friendly size', 'Potential single-family use'],
    dueDiligence: ['Confirm zoning district', 'Review tree/save rules', 'Check utility locations', 'Run finished-home comp set'],
  },
  {
    id: 'boise-id-235-acre-acreage',
    title: '2.35 acres in Boise, ID',
    price: 325000,
    lotSize: '2.35 acres',
    acres: 2.35,
    city: 'Boise',
    state: 'ID',
    county: 'Ada',
    source: 'Land.com',
    sourceUrl: 'https://www.land.com/',
    listedDate: '2026-08-11',
    sellerName: 'Trevor Hunt',
    sellerCompany: 'Intermountain Dirt Co.',
    sellerEmail: 'trevor@example-land.com',
    sellerPhone: '(208) 555-0164',
    zoning: 'Residential acreage',
    roadAccess: 'County road',
    utilities: 'Power nearby; septic/well to verify',
    propertyType: 'Acreage homesite',
    summary: 'Premium small acreage lead in a supply-constrained market. Best fit is a custom-home buyer or builder who can absorb entitlement and utility uncertainty.',
    highlights: ['Small acreage', 'High-demand market', 'County road access', 'Custom-home potential'],
    dueDiligence: ['Verify buildable envelope', 'Confirm water rights/well feasibility', 'Estimate septic cost', 'Review county permit timeline'],
  },
];

export function formatLeadPrice(price: number): string {
  return price >= 1_000_000 ? `$${(price / 1_000_000).toFixed(1)}M` : `$${price.toLocaleString()}`;
}

export function formatLeadDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
