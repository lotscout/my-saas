'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserProfile, type UserProfile } from '@/lib/profile';
import { getListingsThisPeriod } from '@/lib/listings';
import {
  canCreateListing,
  getReportDeliveryTime,
  hasFinancingAccess,
  hasAccountManager,
  hasEarlyAccess,
  hasQuarterlyReports,
  hasWhiteGloveOnboarding,
  has24x7Support,
  getPromotedBoostPrice,
  type Tier,
  type ListingStatus,
} from '@/lib/permissions';

export interface Permissions {
  // Loading / auth state
  loading: boolean;
  profile: UserProfile | null;
  tier: Tier | null;

  // Listing quota
  listingsThisPeriod: number;
  listingStatus: ListingStatus | null;

  // Feature flags
  reportDeliveryTime: '24hr' | '15min' | null;
  financingAccess: boolean;
  accountManager: boolean;
  earlyAccess: boolean;
  quarterlyReports: boolean;
  whiteGloveOnboarding: boolean;
  support24x7: boolean;
  promotedBoostPrice: 29 | 5.80 | null;
}

const DEFAULT: Permissions = {
  loading: true,
  profile: null,
  tier: null,
  listingsThisPeriod: 0,
  listingStatus: null,
  reportDeliveryTime: null,
  financingAccess: false,
  accountManager: false,
  earlyAccess: false,
  quarterlyReports: false,
  whiteGloveOnboarding: false,
  support24x7: false,
  promotedBoostPrice: null,
};

export function usePermissions(): Permissions {
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const profile = await getUserProfile(supabase);

      if (cancelled) return;

      if (!profile) {
        setPermissions({ ...DEFAULT, loading: false });
        return;
      }

      const tier = profile.tier;
      const listingsThisPeriod = await getListingsThisPeriod(
        supabase,
        profile.id,
        profile.created_at
      );

      if (cancelled) return;

      setPermissions({
        loading: false,
        profile,
        tier,
        listingsThisPeriod,
        listingStatus: canCreateListing(tier, listingsThisPeriod),
        reportDeliveryTime: getReportDeliveryTime(tier),
        financingAccess: hasFinancingAccess(tier),
        accountManager: hasAccountManager(tier),
        earlyAccess: hasEarlyAccess(tier),
        quarterlyReports: hasQuarterlyReports(tier),
        whiteGloveOnboarding: hasWhiteGloveOnboarding(tier),
        support24x7: has24x7Support(tier),
        promotedBoostPrice: getPromotedBoostPrice(tier),
      });
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return permissions;
}
