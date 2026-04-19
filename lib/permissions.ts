export type Tier = 'standard' | 'priority' | 'exclusive';
export type ListingStatus = 'allowed' | 'warn1' | 'warn2' | 'blocked';

// Standard tier is capped at 3 listings per 30-day period.
// warn1 = 2 used (1 remaining)
// warn2 = 3 used (0 remaining, not yet blocked)
// blocked = attempting a 4th
const STANDARD_LISTING_LIMIT = 3;

export function canCreateListing(tier: Tier, listingsInPeriod: number): ListingStatus {
  if (tier === 'priority' || tier === 'exclusive') return 'allowed';

  if (listingsInPeriod >= STANDARD_LISTING_LIMIT + 1) return 'blocked';
  if (listingsInPeriod === STANDARD_LISTING_LIMIT) return 'warn2';
  if (listingsInPeriod === STANDARD_LISTING_LIMIT - 1) return 'warn1';
  return 'allowed';
}

export function getReportDeliveryTime(tier: Tier): '24hr' | '15min' {
  return tier === 'standard' ? '24hr' : '15min';
}

export function hasFinancingAccess(tier: Tier): boolean {
  return tier === 'exclusive';
}

export function hasAccountManager(tier: Tier): boolean {
  return tier === 'exclusive';
}

export function hasEarlyAccess(tier: Tier): boolean {
  return tier === 'exclusive';
}

export function hasQuarterlyReports(tier: Tier): boolean {
  return tier === 'exclusive';
}

export function hasWhiteGloveOnboarding(tier: Tier): boolean {
  return tier === 'exclusive';
}

export function has24x7Support(tier: Tier): boolean {
  return tier === 'priority' || tier === 'exclusive';
}

// Promoted boost price per listing
export function getPromotedBoostPrice(tier: Tier): 29 | 5.80 {
  return tier === 'standard' ? 29 : 5.80;
}
