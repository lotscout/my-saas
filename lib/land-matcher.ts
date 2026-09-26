export type BuyerProfile = {
  id: string;
  company: string;
  contactName: string;
  market: string;
  neighborhoods: string[];
  zoning: string[];
  minLotSqft: number;
  maxLotSqft: number;
  maxPrice: number;
  buildType: string;
  notes: string;
  status: 'active' | 'warm' | 'paused';
};

export type LandParcel = {
  id: string;
  attomId?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  ownerMailingAddress: string;
  ownerType: 'Individual' | 'LLC' | 'Trust' | 'Corporate';
  absenteeOwner: boolean;
  outOfStateOwner: boolean;
  lotSqft: number;
  zoning: string;
  landUse: string;
  assessedValue: number;
  lastSalePrice?: number;
  lastSaleYear?: number;
  yearsOwned: number;
  taxDelinquent: boolean;
  lat: number;
  lng: number;
  flags: string[];
  contactStatus: 'new' | 'call' | 'mail' | 'emailed' | 'follow-up' | 'not-interested';
};

export type ParcelMatch = {
  buyer: BuyerProfile;
  parcel: LandParcel;
  buyerFitScore: number;
  sellerMotivationScore: number;
  opportunityScore: number;
  reasons: string[];
  redFlags: string[];
  outreachAngle: string;
};

export const seedBuyers: BuyerProfile[] = [
  {
    id: 'buyer-sunnyside-infill',
    company: 'Front Range Infill Builders',
    contactName: 'Acquisitions Team',
    market: 'Denver infill',
    neighborhoods: ['Sunnyside', 'Berkeley', 'Highland', 'West Highland'],
    zoning: ['U-SU-C', 'U-SU-B', 'U-RH-2.5'],
    minLotSqft: 4500,
    maxLotSqft: 7500,
    maxPrice: 525000,
    buildType: 'Detached infill / scrape lots',
    notes: 'Likes clean residential lots with alley access and simple entitlement path.',
    status: 'active',
  },
  {
    id: 'buyer-duplex-west',
    company: 'Mile High Duplex Co.',
    contactName: 'Land Buyer',
    market: 'West Denver',
    neighborhoods: ['Sloan Lake', 'Villa Park', 'Barnum', 'West Colfax'],
    zoning: ['G-MU-3', 'E-TU-C', 'U-RH-2.5'],
    minLotSqft: 5000,
    maxLotSqft: 12000,
    maxPrice: 700000,
    buildType: 'Duplex / small multifamily',
    notes: 'Will stretch on price if zoning supports density or strong resale comps.',
    status: 'active',
  },
  {
    id: 'buyer-entry-sfr',
    company: 'Denver Starter Homes',
    contactName: 'Owner',
    market: 'Affordable Denver lots',
    neighborhoods: ['Globeville', 'Elyria Swansea', 'Montbello', 'Ruby Hill'],
    zoning: ['E-SU-DX', 'E-SU-D1X', 'U-SU-C'],
    minLotSqft: 3500,
    maxLotSqft: 8500,
    maxPrice: 350000,
    buildType: 'Entry-level single family',
    notes: 'Prefers lower basis lots with straightforward utilities nearby.',
    status: 'warm',
  },
];

export const seedParcels: LandParcel[] = [
  {
    id: 'parcel-4421-zuni',
    attomId: 'sample-attom-1001',
    address: '4421 Zuni St',
    neighborhood: 'Sunnyside',
    city: 'Denver',
    state: 'CO',
    zip: '80211',
    ownerName: 'Zuni Family Trust',
    ownerMailingAddress: 'Scottsdale, AZ',
    ownerType: 'Trust',
    absenteeOwner: true,
    outOfStateOwner: true,
    lotSqft: 6250,
    zoning: 'U-SU-C',
    landUse: 'Vacant residential land',
    assessedValue: 318000,
    lastSalePrice: 92000,
    lastSaleYear: 2009,
    yearsOwned: 17,
    taxDelinquent: false,
    lat: 39.7774,
    lng: -105.0154,
    flags: ['Alley nearby', 'Long-term owner', 'Infill street'],
    contactStatus: 'new',
  },
  {
    id: 'parcel-1320-irving',
    attomId: 'sample-attom-1002',
    address: '1320 Irving St',
    neighborhood: 'West Colfax',
    city: 'Denver',
    state: 'CO',
    zip: '80204',
    ownerName: 'Irving Holdings LLC',
    ownerMailingAddress: 'Lakewood, CO',
    ownerType: 'LLC',
    absenteeOwner: true,
    outOfStateOwner: false,
    lotSqft: 8400,
    zoning: 'G-MU-3',
    landUse: 'Vacant commercial/residential land',
    assessedValue: 510000,
    lastSalePrice: 275000,
    lastSaleYear: 2015,
    yearsOwned: 11,
    taxDelinquent: true,
    lat: 39.7375,
    lng: -105.0299,
    flags: ['Mixed-use zoning', 'Tax delinquency signal', 'Near transit corridor'],
    contactStatus: 'follow-up',
  },
  {
    id: 'parcel-5155-bolling',
    attomId: 'sample-attom-1003',
    address: '5155 Bolling Dr',
    neighborhood: 'Montbello',
    city: 'Denver',
    state: 'CO',
    zip: '80239',
    ownerName: 'Maria Sanchez',
    ownerMailingAddress: 'Pueblo, CO',
    ownerType: 'Individual',
    absenteeOwner: true,
    outOfStateOwner: false,
    lotSqft: 7200,
    zoning: 'E-SU-DX',
    landUse: 'Vacant residential land',
    assessedValue: 210000,
    lastSalePrice: 48000,
    lastSaleYear: 2001,
    yearsOwned: 25,
    taxDelinquent: false,
    lat: 39.7872,
    lng: -104.8388,
    flags: ['Low basis', 'Long-term owner', 'Residential infill'],
    contactStatus: 'new',
  },
  {
    id: 'parcel-2910-grove',
    attomId: 'sample-attom-1004',
    address: '2910 Grove St',
    neighborhood: 'Sloan Lake',
    city: 'Denver',
    state: 'CO',
    zip: '80211',
    ownerName: 'Grove Street Partners Inc.',
    ownerMailingAddress: 'Denver, CO',
    ownerType: 'Corporate',
    absenteeOwner: false,
    outOfStateOwner: false,
    lotSqft: 5400,
    zoning: 'U-RH-2.5',
    landUse: 'Vacant residential land',
    assessedValue: 590000,
    lastSalePrice: 440000,
    lastSaleYear: 2022,
    yearsOwned: 4,
    taxDelinquent: false,
    lat: 39.7589,
    lng: -105.0268,
    flags: ['High-value neighborhood', 'Attached housing zoning'],
    contactStatus: 'emailed',
  },
  {
    id: 'parcel-4860-pecos',
    attomId: 'sample-attom-1005',
    address: '4860 Pecos St',
    neighborhood: 'Globeville',
    city: 'Denver',
    state: 'CO',
    zip: '80221',
    ownerName: 'Pecos Land LLC',
    ownerMailingAddress: 'Cheyenne, WY',
    ownerType: 'LLC',
    absenteeOwner: true,
    outOfStateOwner: true,
    lotSqft: 4650,
    zoning: 'U-SU-C',
    landUse: 'Vacant residential land',
    assessedValue: 245000,
    lastSalePrice: 112000,
    lastSaleYear: 2012,
    yearsOwned: 14,
    taxDelinquent: false,
    lat: 39.7846,
    lng: -105.0069,
    flags: ['Out-of-state LLC', 'Small infill lot', 'Nearby redevelopment'],
    contactStatus: 'call',
  },
];

function withinRange(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatSqft(value: number) {
  return `${new Intl.NumberFormat('en-US').format(value)} sqft`;
}

export function scoreBuyerFit(buyer: BuyerProfile, parcel: LandParcel) {
  let score = 0;
  const reasons: string[] = [];
  const redFlags: string[] = [];

  if (buyer.neighborhoods.includes(parcel.neighborhood)) {
    score += 25;
    reasons.push(`Matches ${buyer.company}'s target neighborhood: ${parcel.neighborhood}`);
  }

  if (buyer.zoning.includes(parcel.zoning)) {
    score += 25;
    reasons.push(`Zoning fits the buy box: ${parcel.zoning}`);
  } else {
    redFlags.push(`Zoning ${parcel.zoning} is not in this buyer's preferred list`);
  }

  if (withinRange(parcel.lotSqft, buyer.minLotSqft, buyer.maxLotSqft)) {
    score += 20;
    reasons.push(`Lot size fits: ${formatSqft(parcel.lotSqft)}`);
  } else {
    redFlags.push(`Lot size outside target range: ${formatSqft(parcel.lotSqft)}`);
  }

  if (parcel.assessedValue <= buyer.maxPrice) {
    score += 15;
    reasons.push(`Assessed value is under max target: ${formatCurrency(parcel.assessedValue)}`);
  } else {
    redFlags.push(`Assessed value may be high for this buyer: ${formatCurrency(parcel.assessedValue)}`);
  }

  if (parcel.flags.some(flag => /alley|redevelopment|corridor|infill|mixed-use/i.test(flag))) {
    score += 10;
    reasons.push('Development context looks useful based on parcel flags');
  }

  if (redFlags.length === 0) score += 5;

  return { score: Math.min(score, 100), reasons, redFlags };
}

export function scoreSellerMotivation(parcel: LandParcel) {
  let score = 0;
  const reasons: string[] = [];

  if (parcel.absenteeOwner) {
    score += 15;
    reasons.push('Absentee owner');
  }
  if (parcel.outOfStateOwner) {
    score += 15;
    reasons.push('Out-of-state mailing address');
  }
  if (parcel.yearsOwned >= 10) {
    score += 20;
    reasons.push(`${parcel.yearsOwned}+ years of ownership`);
  }
  if (/vacant/i.test(parcel.landUse)) {
    score += 15;
    reasons.push('Vacant land use');
  }
  if (parcel.taxDelinquent) {
    score += 20;
    reasons.push('Tax delinquency signal');
  }
  if (parcel.ownerType === 'Trust' || parcel.ownerType === 'LLC') {
    score += 10;
    reasons.push(`${parcel.ownerType} ownership`);
  }
  if ((parcel.lastSaleYear ?? 9999) < 2015) {
    score += 5;
    reasons.push('Older basis / no recent trade');
  }

  return { score: Math.min(score, 100), reasons };
}

export function buildMatches(buyers: BuyerProfile[] = seedBuyers, parcels: LandParcel[] = seedParcels): ParcelMatch[] {
  const matches = buyers.flatMap(buyer => parcels.map(parcel => {
    const fit = scoreBuyerFit(buyer, parcel);
    const motivation = scoreSellerMotivation(parcel);
    const opportunityScore = Math.round((fit.score * 0.65) + (motivation.score * 0.35));

    return {
      buyer,
      parcel,
      buyerFitScore: fit.score,
      sellerMotivationScore: motivation.score,
      opportunityScore,
      reasons: [...fit.reasons, ...motivation.reasons],
      redFlags: fit.redFlags,
      outreachAngle: `We work with local builders looking for ${buyer.buildType.toLowerCase()} opportunities in ${parcel.neighborhood}. Your lot at ${parcel.address} appears to match active criteria. Would you consider selling if the terms made sense?`,
    } satisfies ParcelMatch;
  }));

  return matches
    .filter(match => match.buyerFitScore >= 45)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}
