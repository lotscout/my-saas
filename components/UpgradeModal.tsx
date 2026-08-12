'use client';

import Link from 'next/link';
import type { Tier } from '@/lib/permissions';

interface UpgradeModalProps {
  featureName: string;
  requiredTier: Tier;
  onDismiss: () => void;
}

const TIER_LABEL: Record<Tier, string> = {
  standard: 'Standard',
  priority: 'Priority',
  exclusive: 'Exclusive',
};

export default function UpgradeModal({ featureName, requiredTier, onDismiss }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        </div>

        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          Upgrade to {TIER_LABEL[requiredTier]}
        </h2>
        <p className="text-secondary text-sm mb-6 leading-relaxed">
          <span className="font-semibold text-on-surface">{featureName}</span> is available on the{' '}
          {TIER_LABEL[requiredTier]} plan and above. Upgrade to unlock this feature and get more out of LotScout.
        </p>

        <div className="flex gap-3">
          <Link
            href="/pricing"
            className="flex-1 bg-[#1D9E75] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-[#14795A] transition-colors"
          >
            Upgrade Now
          </Link>
          <button
            onClick={onDismiss}
            className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
