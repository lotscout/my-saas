'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

const GRID = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr' } as const;

const FEATURES = [
  { name: 'Land Marketplace Access',     standard: true,          priority: true,          exclusive: true          },
  { name: 'Buyer Directory Access',      standard: true,          priority: true,          exclusive: true          },
  { name: 'Custom Company Profile',      standard: true,          priority: true,          exclusive: true          },
  { name: 'Lot Analysis Reports',        standard: true,          priority: true,          exclusive: true          },
  { name: 'Property Analysis Reports',   standard: '5/month',     priority: '15/month',    exclusive: 'Unlimited'   },
  { name: 'Additional Analysis Reports', standard: '$4.99 each',  priority: '$4.99 each',  exclusive: false         },
  { name: 'Lot to Buyer Match AI',       standard: true,          priority: true,          exclusive: true          },
  { name: 'Report Delivery',             standard: '24 hours',    priority: '24 hours',    exclusive: '15 min'      },
  { name: 'Unlimited Listings',          standard: false,         priority: true,          exclusive: true          },
  { name: 'Promoted Lot Requests',       standard: false,         priority: true,          exclusive: true          },
  { name: 'Financing Partners Access',   standard: false,         priority: true,          exclusive: true          },
  { name: '24/7 Support',               standard: false,         priority: true,          exclusive: true          },
  { name: 'Hands-On Listing Support',   standard: false,         priority: false,         exclusive: true          },
];

function Check({ muted = false }: { muted?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${muted ? 'text-on-primary-container' : 'text-primary'}`}
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      check_circle
    </span>
  );
}

function Dash() {
  return <span className="text-outline-variant text-base">—</span>;
}

const ANNUAL_PRICES  = { standard: 97,  priority: 329, exclusive: 579 };
const MONTHLY_PRICES = { standard: 113, priority: 384, exclusive: 675 };
export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const { tier: userTier } = useUserTier();

  const prices = isAnnual ? ANNUAL_PRICES : MONTHLY_PRICES;

  function billingSubtext() {
    return isAnnual ? 'Billed annually' : 'Billed monthly · no commitment';
  }

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
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24 pb-20 px-6 max-w-7xl mx-auto w-full">
        {/* Page heading */}
        <header className="mb-8">
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight"><span className="text-emerald-600">Pricing</span></h1>
        </header>

        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">

          {/* ── Column headers ── */}
          <div style={GRID} className="border-b border-outline-variant/10">

            {/* Top-left: billing toggle */}
            <div className="p-5 flex flex-col justify-center gap-3">
              <div className="flex flex-col gap-1.5 self-start">
                <div className="inline-flex items-center p-1 bg-surface-container-high rounded-full self-start">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                      !isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                      isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    Annual
                  </button>
                </div>
                <span className="text-emerald-700 text-xs font-bold pl-1">Get 2 months free</span>
              </div>
            </div>

            {/* Standard */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-secondary font-bold text-sm tracking-widest uppercase">Standard</span>
                {userTier === 'standard' && (
                  <span className="text-secondary text-xs font-semibold">Current Plan</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.standard}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext()}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('standard'))}
                disabled={!!loading || userTier === 'standard'}
                className={`mt-auto w-full py-3 px-4 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${userTier === 'standard' ? 'bg-surface-container-high text-secondary cursor-default' : 'border border-outline text-primary hover:bg-surface-container-low'}`}
              >
                {userTier === 'standard' ? 'Current Plan' : loading === getPriceKey('standard') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Priority */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10 relative">
              {userTier === 'priority' ? (
                <span className="absolute top-2 right-2 text-secondary text-xs font-semibold">Current Plan</span>
              ) : (
                <span className="absolute top-2 right-2 rotate-12 bg-[#1B4332] text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide shadow-sm">
                  Most Popular
                </span>
              )}
              <div className="mb-2 text-center">
                <span className="text-secondary font-bold text-sm tracking-widest uppercase">Priority</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1 justify-center">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.priority}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4 text-center">{billingSubtext()}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('priority'))}
                disabled={!!loading || userTier === 'priority'}
                className={`mt-auto w-full py-3 px-4 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${userTier === 'priority' ? 'bg-surface-container-high text-secondary cursor-default' : 'bg-primary text-on-primary hover:opacity-90 shadow-lg shadow-primary/20'}`}
              >
                {userTier === 'priority' ? 'Current Plan' : loading === getPriceKey('priority') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Exclusive */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-secondary font-bold text-sm tracking-widest uppercase">Exclusive</span>
                {userTier === 'exclusive' && (
                  <span className="text-secondary text-xs font-semibold">Current Plan</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.exclusive}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext()}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('exclusive'))}
                disabled={!!loading || userTier === 'exclusive'}
                className={`mt-auto w-full py-3 px-4 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${userTier === 'exclusive' ? 'bg-surface-container-high text-secondary cursor-default' : 'border border-outline text-primary hover:bg-surface-container-low'}`}
              >
                {userTier === 'exclusive' ? 'Current Plan' : loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* ── Feature rows ── */}
          {FEATURES.map((feature, fi) => {
            const cell = (val: boolean | string) =>
              typeof val === 'string'
                ? <span className="text-xs font-bold text-primary">{val}</span>
                : val ? <Check /> : <Dash />;
            return (
              <div
                key={fi}
                style={GRID}
                className={fi > 0 ? 'border-t border-outline-variant/5' : 'border-t border-outline-variant/10'}
              >
                <div className="py-1 pl-8 pr-4 text-sm text-secondary flex items-center">
                  {feature.name}
                </div>
                <div className="py-1 px-4 flex justify-center items-center border-l border-outline-variant/10">
                  {cell(feature.standard)}
                </div>
                <div className="py-1 px-4 flex justify-center items-center border-l border-outline-variant/10">
                  {cell(feature.priority)}
                </div>
                <div className="py-1 px-4 flex justify-center items-center border-l border-outline-variant/10">
                  {cell(feature.exclusive)}
                </div>
              </div>
            );
          })}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 w-full py-12 px-8 mt-auto text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
          <div>
            <div className="text-xl font-bold text-emerald-50 mb-4 font-headline">LotScout</div>
            <p className="text-emerald-300/60 leading-relaxed max-w-sm">
              Precision cartography tools for the next generation of land acquisition experts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Terms of Service</a>
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Privacy Policy</a>
            </div>
            <div className="space-y-3">
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Data Sources</a>
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Contact Support</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-emerald-900 mt-12 pt-8 text-center text-emerald-200/40">
          © 2024 LotScout Digital Cartography. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
