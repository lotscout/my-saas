'use client';

import { useState } from 'react';
import Header from '@/components/Header';

type Tier = 'standard' | 'priority' | 'exclusive';

const SECTIONS = [
  {
    label: 'Core Access',
    features: [
      { name: 'Land Marketplace Access', standard: true, priority: true, exclusive: true },
      { name: 'Buyer Directory Access', standard: true, priority: true, exclusive: true },
      { name: 'Custom Company Profile', standard: true, priority: true, exclusive: true },
    ],
  },
  {
    label: 'Analysis Tools',
    features: [
      { name: 'Lot Analysis Reports', standard: true, priority: true, exclusive: true },
      { name: 'Property Analysis Reports', standard: true, priority: true, exclusive: true },
      { name: 'Lot to Buyer Match AI', standard: true, priority: true, exclusive: true },
    ],
  },
  {
    label: 'Growth Features',
    features: [
      { name: 'Unlimited Listings', standard: false, priority: true, exclusive: true },
      { name: 'Promoted Lot Requests', standard: false, priority: true, exclusive: true },
      { name: 'Financing Partners Access', standard: false, priority: true, exclusive: true },
      { name: 'Hands-On Listing Support', standard: false, priority: false, exclusive: true },
    ],
  },
  {
    label: 'Support',
    features: [
      { name: '24/7 Support', standard: false, priority: true, exclusive: true },
    ],
  },
];

function Check() {
  return <span className="material-symbols-outlined text-base text-emerald-500">check_circle</span>;
}

function Dash() {
  return <span className="material-symbols-outlined text-base text-slate-300">remove</span>;
}

function Cell({ included }: { included: boolean }) {
  return (
    <td className="py-1 text-center">
      {included ? <Check /> : <Dash />}
    </td>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

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

  const prices = {
    standard: isAnnual ? 81 : 97,
    priority: isAnnual ? 274 : 329,
    exclusive: isAnnual ? 665 : 799,
  };
  const billingLabel = isAnnual ? 'Billed annually' : 'Billed monthly';

  const tiers: { key: Tier; monthlyKey: string; annualKey: string; label: string; desc: string }[] = [
    { key: 'standard', monthlyKey: 'standardMonthly', annualKey: 'standardAnnual', label: 'Standard', desc: 'For first-time buyers and sellers' },
    { key: 'priority', monthlyKey: 'priorityMonthly', annualKey: 'priorityAnnual', label: 'Priority', desc: 'For active, experienced buyers and sellers' },
    { key: 'exclusive', monthlyKey: 'exclusiveMonthly', annualKey: 'exclusiveAnnual', label: 'Exclusive', desc: 'For high-volume sellers and firms' },
  ];

  return (
    <div className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body">
      <Header />

      <main className="pt-20 pb-4 px-6 md:px-12 max-w-[1200px] mx-auto">

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3 items-stretch">

          {/* Standard */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col hover:shadow-lg transition-all">
            <h3 className="text-lg font-extrabold text-slate-700 mb-0.5 font-headline">Standard</h3>
            <p className="text-slate-500 text-xs mb-2">For first-time buyers and sellers</p>
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-2xl font-extrabold text-slate-800">${prices.standard}</span>
              <span className="text-slate-400 text-sm font-medium">/mo</span>
            </div>
            <p className="text-slate-400 text-xs mb-2">{billingLabel}</p>
            <button
              onClick={() => handleCheckout(isAnnual ? 'standardAnnual' : 'standardMonthly')}
              disabled={!!loading}
              className="mt-auto w-full py-1.5 text-xs border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              {loading === (isAnnual ? 'standardAnnual' : 'standardMonthly') ? 'Loading…' : 'Get Started'}
            </button>
          </div>

          {/* Priority */}
          <div className="bg-emerald-600 border-2 border-emerald-400 rounded-xl p-3 flex flex-col relative shadow-2xl shadow-emerald-700/40 scale-105 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-950 text-emerald-50 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-[0.15em] shadow-lg whitespace-nowrap">
              Most Popular
            </div>
            <h3 className="text-lg font-extrabold text-white mb-0.5 font-headline mt-2.5">Priority</h3>
            <p className="text-emerald-100/80 text-xs mb-2">For active, experienced buyers and sellers</p>
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-2xl font-extrabold text-white">${prices.priority}</span>
              <span className="text-emerald-200 text-sm font-medium">/mo</span>
            </div>
            <p className="text-emerald-200 text-xs mb-2">{billingLabel}</p>
            <button
              onClick={() => handleCheckout(isAnnual ? 'priorityAnnual' : 'priorityMonthly')}
              disabled={!!loading}
              className="mt-auto w-full py-1.5 text-xs bg-white text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-colors shadow-lg disabled:opacity-60"
            >
              {loading === (isAnnual ? 'priorityAnnual' : 'priorityMonthly') ? 'Loading…' : 'Get Started'}
            </button>
          </div>

          {/* Exclusive */}
          <div className="bg-emerald-950 border border-emerald-800/50 rounded-xl p-3 flex flex-col hover:shadow-2xl hover:shadow-emerald-950/50 transition-all">
            <h3 className="text-lg font-extrabold text-emerald-50 mb-0.5 font-headline">Exclusive</h3>
            <p className="text-emerald-400/70 text-xs mb-2">For high-volume sellers and firms</p>
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-2xl font-extrabold text-emerald-50">${prices.exclusive}</span>
              <span className="text-emerald-400 text-sm font-medium">/mo</span>
            </div>
            <p className="text-emerald-400 text-xs mb-2">{billingLabel}</p>
            <button
              onClick={() => handleCheckout(isAnnual ? 'exclusiveAnnual' : 'exclusiveMonthly')}
              disabled={!!loading}
              className="mt-auto w-full py-1.5 text-xs bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-black/30 disabled:opacity-60"
            >
              {loading === (isAnnual ? 'exclusiveAnnual' : 'exclusiveMonthly') ? 'Loading…' : 'Get Started'}
            </button>
          </div>

        </div>

        {/* Billing Toggle */}
        <div className="flex flex-col items-center gap-1.5 mb-3">
          <div className="bg-surface-container-low p-1 rounded-full flex items-center gap-1 border border-outline/10">
            <button
              className={`px-6 py-1 rounded-full text-xs font-bold transition-all ${!isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => setIsAnnual(false)}
            >Monthly</button>
            <button
              className={`px-6 py-1 rounded-full text-xs font-bold transition-all ${isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => setIsAnnual(true)}
            >Annual</button>
          </div>
          <span className="text-primary-container font-bold text-xs tracking-widest uppercase bg-primary-fixed px-3 py-1 rounded-full">
            Get two months free when switching to annual billing
          </span>
        </div>

        {/* Feature Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-1 px-4 text-left text-sm font-bold text-slate-500 w-1/2">Feature</th>
                <th className="py-1 px-4 text-center text-sm font-extrabold text-slate-700 w-[16.66%]">Standard</th>
                <th className="py-1 px-4 text-center text-sm font-extrabold text-emerald-600 w-[16.66%]">Priority</th>
                <th className="py-1 px-4 text-center text-sm font-extrabold text-emerald-950 w-[16.66%]">Exclusive</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section, si) => (
                <>
                  <tr key={`section-${si}`} className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={4} className="py-0.5 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                      {section.label}
                    </td>
                  </tr>
                  {section.features.map((feature, fi) => (
                    <tr
                      key={`feature-${si}-${fi}`}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-1 px-4 font-medium text-slate-700">{feature.name}</td>
                      <Cell included={feature.standard} />
                      <Cell included={feature.priority} />
                      <Cell included={feature.exclusive} />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-50 w-full py-20 px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <div>
            <div className="text-3xl font-bold text-emerald-50 mb-6 tracking-tighter font-headline">LotScout</div>
            <p className="font-body text-lg tracking-normal text-emerald-300/60 max-w-sm">&copy; 2024 LotScout Digital Cartography. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6 md:justify-end">
            <a className="font-body text-lg font-medium tracking-normal text-emerald-300/60 hover:text-emerald-50 hover:underline decoration-emerald-500/50 transition-opacity" href="#">Terms of Service</a>
            <a className="font-body text-lg font-medium tracking-normal text-emerald-300/60 hover:text-emerald-50 hover:underline decoration-emerald-500/50 transition-opacity" href="#">Privacy Policy</a>
            <a className="font-body text-lg font-medium tracking-normal text-emerald-300/60 hover:text-emerald-50 hover:underline decoration-emerald-500/50 transition-opacity" href="#">Data Sources</a>
            <a className="font-body text-lg font-medium tracking-normal text-emerald-300/60 hover:text-emerald-50 hover:underline decoration-emerald-500/50 transition-opacity" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
