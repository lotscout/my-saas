'use client';

import { usePermissions } from './usePermissions';
import type { Tier } from '@/lib/permissions';

export interface Subscription {
  tier: Tier | null;
  loading: boolean;
}

export function useSubscription(): Subscription {
  const { tier, loading } = usePermissions();
  return { tier, loading };
}
