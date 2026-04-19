'use client';

import Link from 'next/link';
import type { Tier } from '@/lib/permissions';

interface Props {
  children: React.ReactNode;
  requiredTier: Tier;
  message: string;
  className?: string;
}

export default function LockedFeature({ children, requiredTier, message, className = '' }: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center bg-white/65 backdrop-blur-[2px]">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        </div>
        <p className="text-sm font-semibold text-on-surface max-w-[220px] leading-snug">{message}</p>
        <Link
          href="/pricing"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm"
        >
          View Plans
        </Link>
      </div>
    </div>
  );
}
