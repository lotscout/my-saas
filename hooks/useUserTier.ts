'use client';

import { usePermissions } from './usePermissions';
import type { Tier } from '@/lib/permissions';

const TIER_ORDER: Record<Tier, number> = { standard: 0, priority: 1, exclusive: 2 };

export function useUserTier() {
  const { tier, loading, isAdmin } = usePermissions();

  function isAtLeast(required: Tier): boolean {
    if (!tier) return false;
    return TIER_ORDER[tier] >= TIER_ORDER[required];
  }

  return { tier, loading, isAdmin, isAtLeast };
}
