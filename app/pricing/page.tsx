'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

const ANNUAL_PRICES  = { standard: 97,  priority: 329, exclusive: 579 };
const MONTHLY_PRICES = { standard: 113, priority: 384, exclusive: 675 };

interface Feature { check: boolean; text: string; }

const STANDARD_FEATURES: Feature[] = [
  { check: true,  text: 'Marketplace Access' },
  { check: true,  text: 'Buyer Directory' },
  { check: true,  text: 'Company Profile' },
  { check: true,  text: 'Lot Analysis' },
  { check: false, text: '5/mo Property Analysis' },
  { check: false, text: '$4.99 Additional Reports' },
  { check: true,  text: 'Lot to Buyer AI Match' },
  { check: false, text: '24hr Report Delivery' },
];

const PRIORITY_FEATURES: Feature[] = [
  { check: true,  text: 'Marketplace Access' },
  { check: true,  text: 'Buyer Directory' },
  { check: true,  text: 'Company Profile' },
  { check: true,  text: 'Lot Analysis' },
  { check: false, text: '15/mo Property Analysis' },
  { check: false, text: '$4.99 Additional Reports' },
  { check: true,  text: 'Lot to Buyer AI Match' },
  { check: false, text: '24hr Report Delivery' },
  { check: true,  text: 'Unlimited Listings' },
  { check: true,  text: 'Promoted Lot Requests' },
  { check: true,  text: 'Financing Partners' },
  { check: true,  text: '24/7 Support' },
];

const EXCLUSIVE_FEATURES: Feature[] = [
  { check: true,  text: 'Marketplace Access' },
  { check: true,  text: 'Buyer Directory' },
  { check: true,  text: 'Company Profile' },
  { check: true,  text: 'Lot Analysis' },
  { check: false, text: 'Unlimited Property Analysis' },
  { check: false, text: 'No Additional Report Cost' },
  { check: true,  text: 'Lot to Buyer AI Match' },
  { check: false, text: '15min Report Delivery' },
  { check: true,  text: 'Unlimited Listings' },
  { check: true,  text: 'Promoted Lot Requests' },
  { check: true,  text: 'Financing Partners' },
  { check: true,  text: 'Hands-On Listing Support' },
  { check: true,  text: '24/7 Support' },
];

function FeatureRow({ check, text }: Feature) {
  return (
    <div className="flex items-center gap-3">
      {check ? (
        <span
          className="material-symbols-outlined shrink-0 leading-none"
          style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#1B4332' }}
        >
          check_circle
        </span>
      ) : (
        <span className="shrink-0" style={{ width: '20px' }} />
      )}
      <span className={`text-base leading-snug ${check ? 'text-gray-800' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const { tier: userTier } = useUserTier();

  const prices = isAnnual ? ANNUAL_PRICES : MONTHLY_PRICES;
  const billingText = isAnnual ? 'Billed annually' : 'Billed monthly · no commitment';

  function getPriceKey(tier: string) {
    return `${tier}${isAnnual ? 'Annual' : 'Monthly'}`;
  }

  async function handleCheckout(priceKey: string) {
    setLoading(priceKey);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(`Checkout error: ${data.error ?? 'No URL returned'}`);
        setLoading(null);
      }
    } catch (err) {
      alert(`Checkout error: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(null);
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#f7f9fb' }}>
      <Header />

      <div className="flex-1 flex flex-col min-h-0 pt-16">

        {/* Page header */}
        <div className="text-center py-3 flex-shrink-0">
          <h1
            className="font-headline font-extrabold tracking-tight leading-none mb-3"
            style={{ fontSize: '2.75rem', color: '#1B4332' }}
          >
            Pricing
          </h1>

          <div
            className="inline-flex items-center p-1 rounded-full mb-1.5"
            style={{ background: '#e2e8ec' }}
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                !isAnnual ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                isAnnual ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
            </button>
          </div>

          <p className="text-sm font-semibold" style={{ color: '#2d7a4f' }}>
            2 months free with annual billing
          </p>
        </div>

        {/* Cards row */}
        <div className="flex flex-1 min-h-0">

          {/* ── Standard ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              background: '#ffffff',
              border: '1.5px solid #d1d9e0',
              borderRight: 'none',
            }}
          >
            <div className="p-5 flex flex-col gap-0">

              {/* Spacer row to align tier name with Priority (which has the badge above) */}
              <div className="flex items-center gap-2 mb-3" style={{ height: '36px' }}>
                {userTier === 'standard' && (
                  <span className="text-gray-400 text-sm font-semibold">Current Plan</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-headline font-black uppercase tracking-widest text-xl"
                  style={{ color: '#1a1a1a' }}
                >
                  Standard
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-0.5">
                <span
                  className="font-headline font-black leading-none"
                  style={{ fontSize: '3rem', color: '#1B4332' }}
                >
                  ${prices.standard}
                </span>
                <span className="text-lg font-medium text-gray-400">/mo</span>
              </div>

              <p className="text-sm text-gray-400 mb-3">{billingText}</p>

              <button
                onClick={() => handleCheckout(getPriceKey('standard'))}
                disabled={!!loading || userTier === 'standard'}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-60 mb-3 ${
                  userTier === 'standard'
                    ? 'cursor-default'
                    : 'border-2 border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white'
                }`}
                style={userTier === 'standard' ? { background: '#f0f2f4', color: '#9ca3af' } : {}}
              >
                {userTier === 'standard'
                  ? 'Current Plan'
                  : loading === getPriceKey('standard')
                  ? 'Loading…'
                  : 'Get Started'}
              </button>

              <div className="border-t border-gray-100 mb-3" />

              <div className="flex flex-col gap-1">
                {STANDARD_FEATURES.map((f, i) => <FeatureRow key={i} {...f} />)}
              </div>
            </div>
          </div>

          {/* ── Priority ── */}
          <div
            className="flex-1 overflow-y-auto z-10"
            style={{
              background: '#ffffff',
              border: '2.5px solid #1B4332',
              boxShadow: '0 8px 40px rgba(27,67,50,0.18)',
            }}
          >
            <div className="p-5 flex flex-col gap-0">

              {/* Most Popular badge — centered */}
              <div className="flex justify-center mb-3" style={{ height: '36px' }}>
                {userTier === 'priority' ? (
                  <span className="text-gray-400 text-sm font-semibold self-center">Current Plan</span>
                ) : (
                  <span
                    className="font-bold text-base px-6 py-2 rounded-full text-white self-center"
                    style={{ background: '#1B4332' }}
                  >
                    Most Popular
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-headline font-black uppercase tracking-widest text-xl"
                  style={{ color: '#1a1a1a' }}
                >
                  Priority
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-0.5">
                <span
                  className="font-headline font-black leading-none"
                  style={{ fontSize: '3rem', color: '#1B4332' }}
                >
                  ${prices.priority}
                </span>
                <span className="text-lg font-medium text-gray-400">/mo</span>
              </div>

              <p className="text-sm text-gray-400 mb-3">{billingText}</p>

              <button
                onClick={() => handleCheckout(getPriceKey('priority'))}
                disabled={!!loading || userTier === 'priority'}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-60 mb-3 ${
                  userTier === 'priority' ? 'cursor-default' : 'hover:opacity-90'
                }`}
                style={
                  userTier === 'priority'
                    ? { background: '#f0f2f4', color: '#9ca3af' }
                    : {
                        background: '#1B4332',
                        color: '#ffffff',
                        boxShadow: '0 2px 12px rgba(27,67,50,0.25)',
                      }
                }
              >
                {userTier === 'priority'
                  ? 'Current Plan'
                  : loading === getPriceKey('priority')
                  ? 'Loading…'
                  : 'Get Started'}
              </button>

              <div className="border-t border-gray-100 mb-3" />

              <div className="flex flex-col gap-1">
                {PRIORITY_FEATURES.map((f, i) => <FeatureRow key={i} {...f} />)}
              </div>
            </div>
          </div>

          {/* ── Exclusive ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              background: '#ffffff',
              border: '1.5px solid #d1d9e0',
              borderLeft: 'none',
            }}
          >
            <div className="p-5 flex flex-col gap-0">

              {/* Spacer row to align tier name with Priority */}
              <div className="flex items-center gap-2 mb-3" style={{ height: '36px' }}>
                {userTier === 'exclusive' && (
                  <span className="text-gray-400 text-sm font-semibold">Current Plan</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-headline font-black uppercase tracking-widest text-xl"
                  style={{ color: '#1a1a1a' }}
                >
                  Exclusive
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-0.5">
                <span
                  className="font-headline font-black leading-none"
                  style={{ fontSize: '3rem', color: '#1B4332' }}
                >
                  ${prices.exclusive}
                </span>
                <span className="text-lg font-medium text-gray-400">/mo</span>
              </div>

              <p className="text-sm text-gray-400 mb-3">{billingText}</p>

              <button
                onClick={() => handleCheckout(getPriceKey('exclusive'))}
                disabled={!!loading || userTier === 'exclusive'}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-60 mb-3 ${
                  userTier === 'exclusive'
                    ? 'cursor-default'
                    : 'border-2 border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white'
                }`}
                style={userTier === 'exclusive' ? { background: '#f0f2f4', color: '#9ca3af' } : {}}
              >
                {userTier === 'exclusive'
                  ? 'Current Plan'
                  : loading === getPriceKey('exclusive')
                  ? 'Loading…'
                  : 'Get Started'}
              </button>

              <div className="border-t border-gray-100 mb-3" />

              <div className="flex flex-col gap-1">
                {EXCLUSIVE_FEATURES.map((f, i) => <FeatureRow key={i} {...f} />)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
