'use client';

import Link from 'next/link';
import type { Tier } from '@/lib/permissions';

interface ListingLimitBannerProps {
  listingsUsed: number;
  tier: Tier;
}

export default function ListingLimitBanner({ listingsUsed, tier }: ListingLimitBannerProps) {
  if (tier !== 'standard') return null;

  if (listingsUsed === 2) {
    return (
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium">
        <span className="material-symbols-outlined text-amber-500 text-lg flex-none" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        <span>You have <span className="font-bold">1 listing remaining</span> this month.</span>
      </div>
    );
  }

  if (listingsUsed >= 3) {
    return (
      <div className="flex items-center justify-between gap-4 bg-error-container/20 border border-error/20 text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-error text-lg flex-none" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
          <span>You have used all <span className="font-bold">3 listings</span> this month. Upgrade to Priority for unlimited listings.</span>
        </div>
        <Link
          href="/pricing"
          className="flex-none bg-primary text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return null;
}
