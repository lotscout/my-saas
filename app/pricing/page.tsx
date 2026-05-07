'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

const ANNUAL_PRICES  = { standard: 97,  priority: 329, exclusive: 579 };
const MONTHLY_PRICES = { standard: 113, priority: 384, exclusive: 675 };

interface Feature { check: boolean; text: string; strong?: boolean; }

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
  { check: true,  text: '15/mo Property Analysis' },
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
  { check: true,  text: 'Unlimited Property Analysis', strong: true },
  { check: true,  text: 'No Additional Report Cost',  strong: true },
  { check: true,  text: 'Lot to Buyer AI Match' },
  { check: true,  text: '15min Report Delivery',      strong: true },
  { check: true,  text: 'Unlimited Listings' },
  { check: true,  text: 'Promoted Lot Requests' },
  { check: true,  text: 'Financing Partners' },
  { check: true,  text: 'Hands-On Listing Support' },
  { check: true,  text: '24/7 Support' },
];

function FeatureRow({ check, text, strong }: Feature) {
  return (
    <div className="flex items-center gap-3 py-1">
      {check ? (
        <span
          className="material-symbols-outlined shrink-0 leading-none"
          style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#1B4332' }}
        >
          check_circle
        </span>
      ) : (
        <span className="w-5 h-5 shrink-0 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </span>
      )}
      <span className={`text-base leading-tight ${strong ? 'font-semibold' : 'text-gray-700'}`} style={strong ? { color: '#1B4332' } : {}}>
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

          {/* Billing toggle */}
          <div className="inline-flex items-center p-1 rounded-full mb-1.5" style={{ background: '#e4e9ec' }}>
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

        {/* Cards */}
        <div className="flex flex-1 min-h-0">

          {/* Standard */}
          <div
            className="flex-1 flex flex-col overflow-y-auto"
            style={{
              background: '#ffffff',
              border: '1.5px solid #d1d9e0',
              borderRight: 'none',
            }}
          >
            <div className="p-5 flex flex-col h-full">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-headline font-black uppercase tracking-widest text-xl text-gray-800">
                  Standard
                </span>
                {userTier === 'standard' && (
                  <span className="text-gray-400 text-sm font-semibold">Current Plan</span>
                )}
              </div>

              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="font-headline font-black leading-none" style={{ fontSize: '3.5rem', color: '#1B4332' }}>
                  ${prices.standard}
                </span>
                <span className="text-lg text-gray-400 font-medium">/mo</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                {isAnnual ? 'Billed annually' : 'Billed monthly · no commitment'}
              </p>

              <button
                onClick={() => handleCheckout(getPriceKey('standard'))}
                disabled={!!loading || userTier === 'standard'}
                className="w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-60 mb-3"
                style={
                  userTier === 'standard'
                    ? { background: '#f0f2f4', color: '#9ca3af', cursor: 'default' }
                    : {
                        border: '2px solid #1B4332',
                        color: '#1B4332',
                        background: 'transparent',
                      }
                }
                onMouseEnter={e => {
                  if (userTier !== 'standard' && !loading) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1B4332';
                    (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                  }
                }}
                onMouseLeave={e => {
                  if (userTier !== 'standard') {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#1B4332';
                  }
                }}
              >
                {userTier === 'standard' ? 'Current Plan' : loading === getPriceKey('standard') ? 'Loading…' : 'Get Started'}
              </button>

              <div className="border-t border-gray-100 my-1" />

              <div className="flex-1 flex flex-col gap-0.5 pt-1">
                {STANDARD_FEATURES.map((f, i) => <FeatureRow key={i} {...f} />)}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div
            className="flex-1 flex flex-col overflow-y-auto z-10"
            style={{
              background: '#ffffff',
              border: '2.5px solid #1B4332',
              boxShadow: '0 8px 40px 0 rgba(27,67,50,0.18)',
            }}
          >
            <div className="p-5 flex flex-col h-full">
              {/* Most Popular pill */}
              <div className="mb-3">
                {userTier === 'priority' ? (
                  <span className="text-gray-400 text-sm font-semibold">Current Plan</span>
                ) : (
                  <span
                    className="inline-block font-bold text-base px-6 py-1.5 rounded-full text-white"
                    style={{ background: '#1B4332' }}
                  >
                    Most Popular
                  </span>
                )}
              </div>

              <div className="mb-1 flex items-center gap-2">
                <span className="font-headline font-black uppercase tracking-widest text-xl text-gray-800">
                  Priority
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="font-headline font-black leading-none" style={{ fontSize: '3.5rem', color: '#1B4332' }}>
                  ${prices.priority}
                </span>
                <span className="text-lg text-gray-400 font-medium">/mo</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                {isAnnual ? 'Billed annually' : 'Billed monthly · no commitment'}
              </p>

              <button
                onClick={() => handleCheckout(getPriceKey('priority'))}
                disabled={!!loading || userTier === 'priority'}
                className="w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-60 mb-3"
                style={
                  userTier === 'priority'
                    ? { background: '#f0f2f4', color: '#9ca3af', cursor: 'default' }
                    : {
                        background: '#1B4332',
                        color: '#ffffff',
                        boxShadow: '0 2px 12px 0 rgba(27,67,50,0.25)',
                      }
                }
              >
                {userTier === 'priority' ? 'Current Plan' : loading === getPriceKey('priority') ? 'Loading…' : 'Get Started'}
              </button>

              <div className="border-t border-gray-100 my-1" />

              <div className="flex-1 flex flex-col gap-0.5 pt-1">
                {PRIORITY_FEATURES.map((f, i) => <FeatureRow key={i} {...f} />)}
              </div>
            </div>
          </div>

          {/* Exclusive */}
          <div
            className="flex-1 flex flex-col overflow-y-auto"
            style={{
              background: '#ffffff',
              border: '1.5px solid #d1d9e0',
              borderLeft: 'none',
            }}
          >
            <div className="p-5 flex flex-col h-full">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-headline font-black uppercase tracking-widest text-xl text-gray-800">
                  Exclusive
                </span>
                {userTier === 'exclusive' && (
                  <span className="text-gray-400 text-sm font-semibold">Current Plan</span>
                )}
              </div>

              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="font-headline font-black leading-none" style={{ fontSize: '3.5rem', color: '#1B4332' }}>
                  ${prices.exclusive}
                </span>
                <span className="text-lg text-gray-400 font-medium">/mo</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                {isAnnual ? 'Billed annually' : 'Billed monthly · no commitment'}
              </p>

              <button
                onClick={() => handleCheckout(getPriceKey('exclusive'))}
                disabled={!!loading || userTier === 'exclusive'}
                className="w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-60 mb-3"
                style={
                  userTier === 'exclusive'
                    ? { background: '#f0f2f4', color: '#9ca3af', cursor: 'default' }
                    : {
                        border: '2px solid #1B4332',
                        color: '#1B4332',
                        background: 'transparent',
                      }
                }
                onMouseEnter={e => {
                  if (userTier !== 'exclusive' && !loading) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1B4332';
                    (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                  }
                }}
                onMouseLeave={e => {
                  if (userTier !== 'exclusive') {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#1B4332';
                  }
                }}
              >
                {userTier === 'exclusive' ? 'Current Plan' : loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Started'}
              </button>

              <div className="border-t border-gray-100 my-1" />

              <div className="flex-1 flex flex-col gap-0.5 pt-1">
                {EXCLUSIVE_FEATURES.map((f, i) => <FeatureRow key={i} {...f} />)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
