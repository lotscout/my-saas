'use client';

import { useState } from 'react';
import Header from '@/components/Header';

const GRID = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr' } as const;

const SECTIONS = [
  {
    label: 'Core Access',
    features: [
      { name: 'Land Marketplace Access', standard: true,  priority: true,  exclusive: true  },
      { name: 'Buyer Directory Access',  standard: true,  priority: true,  exclusive: true  },
      { name: 'Custom Company Profile',  standard: true,  priority: true,  exclusive: true  },
    ],
  },
  {
    label: 'Analysis Tools',
    features: [
      { name: 'Lot Analysis Reports',      standard: true,  priority: true,  exclusive: true  },
      { name: 'Property Analysis Reports', standard: true,  priority: true,  exclusive: true  },
      { name: 'Lot to Buyer Match AI',     standard: true,  priority: true,  exclusive: true  },
    ],
  },
  {
    label: 'Growth Features',
    features: [
      { name: 'Unlimited Listings',        standard: false, priority: true,  exclusive: true  },
      { name: 'Promoted Lot Requests',     standard: false, priority: true,  exclusive: true  },
      { name: 'Financing Partners Access', standard: false, priority: true,  exclusive: true  },
    ],
  },
  {
    label: 'Support',
    features: [
      { name: 'Hands-On Listing Support', standard: false, priority: false, exclusive: true  },
      { name: '24/7 Support',             standard: false, priority: true,  exclusive: true  },
    ],
  },
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

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const prices = {
    standard: isAnnual ? 81  : 97,
    priority: isAnnual ? 274 : 329,
    exclusive: isAnnual ? 665 : 799,
  };

  const billingLabel = isAnnual ? 'Billed annually' : 'Billed monthly';

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
          <p className="text-secondary font-medium tracking-wide uppercase text-xs mb-1">Plans</p>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight">Platform <span className="text-emerald-600">Pricing</span></h1>
        </header>

        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">

          {/* ── Column headers ── */}
          <div style={GRID} className="border-b border-outline-variant/10">

            {/* Top-left: billing toggle */}
            <div className="p-5 flex flex-col justify-center gap-3">
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
              <div className="bg-on-primary-container/20 text-primary-container px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 self-start">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Get 2 months free with annual billing
              </div>
            </div>

            {/* Standard */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <span className="text-secondary font-bold text-sm tracking-widest mb-2">STANDARD</span>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.standard}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingLabel}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('standard'))}
                disabled={!!loading}
                className="mt-auto w-full py-3 px-4 border border-outline text-primary font-bold rounded-xl hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-60"
              >
                {loading === getPriceKey('standard') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Priority */}
            <div className="p-5 flex flex-col bg-[#f0f8f4] border-l-2 border-r-2 border-primary-container relative">
              <div className="absolute -top-px left-0 right-0 h-1 bg-primary-container" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary-container font-bold text-sm tracking-widest">PRIORITY</span>
                <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter leading-none">
                  Most Popular
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.priority}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingLabel}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('priority'))}
                disabled={!!loading}
                className="mt-auto w-full py-3 px-4 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-60"
              >
                {loading === getPriceKey('priority') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Exclusive */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <span className="text-secondary font-bold text-sm tracking-widest mb-2">EXCLUSIVE</span>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.exclusive}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingLabel}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('exclusive'))}
                disabled={!!loading}
                className="mt-auto w-full py-3 px-4 border border-outline text-primary font-bold rounded-xl hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-60"
              >
                {loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* ── Feature sections ── */}
          {SECTIONS.map((section, si) => (
            <div key={si}>
              {/* Section header */}
              <div style={GRID} className="bg-surface-container-low border-t border-outline-variant/10">
                <div className="py-1.5 pl-8 pr-4 col-span-4 flex items-center">
                  <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">
                    {section.label}
                  </span>
                </div>
              </div>

              {/* Feature rows */}
              {section.features.map((feature, fi) => (
                <div
                  key={fi}
                  style={GRID}
                  className={fi > 0 ? 'border-t border-outline-variant/5' : ''}
                >
                  <div className="py-1 pl-8 pr-4 text-sm text-secondary flex items-center">
                    {feature.name}
                  </div>
                  <div className="py-1 px-4 flex justify-center items-center border-l border-outline-variant/10">
                    {feature.standard ? <Check muted /> : <Dash />}
                  </div>
                  <div className="py-1 px-4 flex justify-center items-center bg-[#f0f8f4] border-l-2 border-r-2 border-primary-container/20">
                    {feature.priority ? <Check /> : <Dash />}
                  </div>
                  <div className="py-1 px-4 flex justify-center items-center border-l border-outline-variant/10">
                    {feature.exclusive ? <Check /> : <Dash />}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Priority column bottom cap */}
          <div style={GRID} className="bg-[#f0f8f4]/30">
            <div className="p-4 pl-8" />
            <div className="p-4 border-l border-outline-variant/10" />
            <div className="p-8 border-l-2 border-r-2 border-b-2 border-primary-container rounded-b-2xl bg-[#f0f8f4]" />
            <div className="p-4 border-l border-outline-variant/10" />
          </div>

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
