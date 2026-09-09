export type Tier = 'standard' | 'priority' | 'exclusive';
export type ListingStatus = 'allowed' | 'warn1' | 'warn2' | 'blocked';

export function canCreateListing(_tier: Tier, _listingsInPeriod: number): ListingStatus {
  return 'allowed';
}

export function getReportDeliveryTime(tier: Tier): '24hr' | '15min' {
  return tier === 'standard' ? '24hr' : '15min';
}

export function hasFinancingAccess(tier: Tier): boolean {
  return tier === 'priority' || tier === 'exclusive';
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
