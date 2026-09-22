'use client';

import { useEffect } from 'react';
import { trackMetaEvent } from '@/lib/meta-pixel';

type PendingCheckout = {
  priceKey?: string;
  tier?: string;
  billing?: string;
  value?: number;
  source?: string;
  startedAt?: number;
};

export default function MetaCheckoutSuccessTracker() {
  useEffect(() => {
    const raw = localStorage.getItem('meta_pending_checkout');
    if (!raw) return;

    let checkout: PendingCheckout = {};
    try {
      checkout = JSON.parse(raw) as PendingCheckout;
    } catch {
      checkout = {};
    }

    const ageMs = checkout.startedAt ? Date.now() - checkout.startedAt : 0;
    const isFresh = !checkout.startedAt || ageMs < 1000 * 60 * 60 * 24;
    if (!isFresh) {
      localStorage.removeItem('meta_pending_checkout');
      return;
    }

    const isSubscription = checkout.source !== 'listing_boost' && checkout.billing !== 'one_time';
    trackMetaEvent(isSubscription ? 'Subscribe' : 'Purchase', {
      content_name: isSubscription ? 'LotScout subscription' : 'LotScout one-time purchase',
      content_category: isSubscription ? 'subscription' : checkout.source,
      content_ids: checkout.priceKey ? [checkout.priceKey] : undefined,
      value: checkout.value,
      currency: 'USD',
      tier: checkout.tier,
      billing: checkout.billing,
      source: checkout.source,
    });

    localStorage.removeItem('meta_pending_checkout');
  }, []);

  return null;
}
