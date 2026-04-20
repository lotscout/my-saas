'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function CreateListingGate({ children, className }: Props) {
  const { tier, profile, loading } = usePermissions();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (loading) return;
    if (!profile) {
      router.push('/sign-up');
      return;
    }
    if (!tier) {
      setShowModal(true);
      return;
    }
    router.push('/create-listing');
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span
                className="material-symbols-outlined text-amber-500 text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                crown
              </span>
            </div>

            <h2 className="font-headline text-xl font-bold text-primary mb-2">
              Create a Listing
            </h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Listing your property requires a paid LotScout account. Choose a plan to get started.
            </p>

            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors"
              >
                View Plans →
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
