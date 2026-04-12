'use client';

import { useState } from 'react';
import Header from '@/components/Header';

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

const PRIORITY_BG = '#f0f8f4';
const PRIORITY_BORDER = '#1B4332';

export default function PricingPage() {
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

  return (
    <div className="bg-background text-on-surface font-body">
      <Header />

      <main className="pt-20 pb-6 px-6 md:px-10 max-w-[1100px] mx-auto">
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {/* Feature column header — empty */}
                <th className="w-[35%] p-0 border-r border-slate-200" />

                {/* Standard card header */}
                <th className="w-[21.66%] p-0 border-r border-slate-200 align-top">
                  <div className="p-4 text-left">
                    <p className="text-xs font-bold text-slate-700 mb-0.5">Standard</p>
                    <p className="text-[11px] text-slate-400 mb-2">For first-time buyers and sellers</p>
                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span className="text-xl font-extrabold text-slate-800">$97</span>
                      <span className="text-slate-400 text-xs">/mo</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3">Billed monthly</p>
                    <button
                      onClick={() => handleCheckout('standardMonthly')}
                      disabled={!!loading}
                      className="w-full py-1.5 text-xs font-bold border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-60"
                    >
                      {loading === 'standardMonthly' ? 'Loading…' : 'Get Started'}
                    </button>
                  </div>
                </th>

                {/* Priority card header */}
                <th
                  className="w-[21.66%] p-0 border-r align-top"
                  style={{ background: PRIORITY_BG, borderColor: PRIORITY_BORDER }}
                >
                  <div
                    className="p-4 text-left border-x-2 border-t-2 rounded-t-xl"
                    style={{ borderColor: PRIORITY_BORDER }}
                  >
                    <span
                      className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 text-white"
                      style={{ background: PRIORITY_BORDER }}
                    >
                      Most Popular
                    </span>
                    <p className="text-xs font-bold mb-0.5" style={{ color: PRIORITY_BORDER }}>Priority</p>
                    <p className="text-[11px] text-emerald-700/60 mb-2">For active, experienced buyers and sellers</p>
                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span className="text-xl font-extrabold" style={{ color: PRIORITY_BORDER }}>$329</span>
                      <span className="text-xs text-emerald-700/60">/mo</span>
                    </div>
                    <p className="text-[10px] text-emerald-700/60 mb-3">Billed monthly</p>
                    <button
                      onClick={() => handleCheckout('priorityMonthly')}
                      disabled={!!loading}
                      className="w-full py-1.5 text-xs font-bold text-white rounded-lg transition-colors disabled:opacity-60"
                      style={{ background: PRIORITY_BORDER }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      {loading === 'priorityMonthly' ? 'Loading…' : 'Get Started'}
                    </button>
                  </div>
                </th>

                {/* Exclusive card header */}
                <th className="w-[21.66%] p-0 align-top">
                  <div className="p-4 text-left bg-emerald-950 rounded-tr-xl">
                    <p className="text-xs font-bold text-emerald-50 mb-0.5">Exclusive</p>
                    <p className="text-[11px] text-emerald-400/70 mb-2">For high-volume sellers and firms</p>
                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span className="text-xl font-extrabold text-emerald-50">$799</span>
                      <span className="text-xs text-emerald-400/70">/mo</span>
                    </div>
                    <p className="text-[10px] text-emerald-400/70 mb-3">Billed monthly</p>
                    <button
                      onClick={() => handleCheckout('exclusiveMonthly')}
                      disabled={!!loading}
                      className="w-full py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-60"
                    >
                      {loading === 'exclusiveMonthly' ? 'Loading…' : 'Get Started'}
                    </button>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {SECTIONS.map((section, si) => (
                <>
                  {/* Section header row */}
                  <tr key={`s-${si}`} className="border-t border-slate-200">
                    <td className="py-1 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-r border-slate-200">
                      {section.label}
                    </td>
                    <td className="py-1 bg-slate-50 border-r border-slate-200" />
                    <td
                      className="py-1 border-x-2"
                      style={{ background: PRIORITY_BG, borderColor: PRIORITY_BORDER }}
                    >
                      <span
                        className="block text-center text-[10px] font-black uppercase tracking-widest text-white mx-2 rounded"
                        style={{ background: PRIORITY_BORDER }}
                      >
                        {section.label}
                      </span>
                    </td>
                    <td className="py-1 bg-slate-50" />
                  </tr>

                  {/* Feature rows */}
                  {section.features.map((feature, fi) => (
                    <tr
                      key={`f-${si}-${fi}`}
                      className="border-t border-slate-100"
                    >
                      <td className="py-1.5 px-4 text-slate-500 font-medium border-r border-slate-200">
                        {feature.name}
                      </td>
                      <td className="py-1.5 text-center border-r border-slate-200">
                        {feature.standard
                          ? <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                          : <span className="material-symbols-outlined text-sm text-slate-300">remove</span>}
                      </td>
                      <td
                        className="py-1.5 text-center border-x-2"
                        style={{ background: PRIORITY_BG, borderColor: PRIORITY_BORDER }}
                      >
                        {feature.priority
                          ? <span className="material-symbols-outlined text-sm" style={{ color: PRIORITY_BORDER }}>check_circle</span>
                          : <span className="material-symbols-outlined text-sm text-slate-400">remove</span>}
                      </td>
                      <td className="py-1.5 text-center bg-emerald-950/[0.03]">
                        {feature.exclusive
                          ? <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                          : <span className="material-symbols-outlined text-sm text-slate-300">remove</span>}
                      </td>
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
