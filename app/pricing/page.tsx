'use client';

import { useState } from 'react';
import Header from '@/components/Header';

const PRIMARY = '#1B4332';
const PRIORITY_BG = '#f0f8f4';
const SECTION_BG = '#f2f4f6';
const PAGE_BG = '#f7f9fb';

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
      { name: 'Unlimited Listings',          standard: false, priority: true,  exclusive: true  },
      { name: 'Promoted Lot Requests',       standard: false, priority: true,  exclusive: true  },
      { name: 'Financing Partners Access',   standard: false, priority: true,  exclusive: true  },
      { name: 'Hands-On Listing Support',    standard: false, priority: false, exclusive: true  },
    ],
  },
  {
    label: 'Support',
    features: [
      { name: '24/7 Support', standard: false, priority: true, exclusive: true },
    ],
  },
];

const totalFeatures = SECTIONS.reduce((n, s) => n + s.features.length, 0);

// Border styles for priority column cells
const pBorderSides  = { borderLeft: `2px solid ${PRIMARY}`, borderRight: `2px solid ${PRIMARY}` };
const pBorderTop    = { borderTop: `2px solid ${PRIMARY}` };
const pBorderBottom = { borderBottom: `2px solid ${PRIMARY}` };

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const prices = {
    standard: isAnnual ? 81  : 97,
    priority: isAnnual ? 274 : 329,
    exclusive: isAnnual ? 665 : 799,
  };

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

  const priceKey = (tier: string) =>
    `${tier}${isAnnual ? 'Annual' : 'Monthly'}`;

  let featureIndex = 0;

  return (
    <div style={{ background: PAGE_BG }} className="min-h-screen font-['Inter']">
      <Header />

      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[960px] mx-auto">

        {/* Billing Toggle */}
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="bg-white border border-slate-200 rounded-full p-1 flex items-center shadow-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className="px-5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={!isAnnual ? { background: PRIMARY, color: '#fff' } : { color: '#64748b' }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className="px-5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={isAnnual ? { background: PRIMARY, color: '#fff' } : { color: '#64748b' }}
            >
              Annual
            </button>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full"
            style={{ background: PRIORITY_BG, color: PRIMARY }}
          >
            Get 2 months free with annual billing
          </span>
        </div>

        {/* Unified pricing table */}
        {/* overflow:visible so the "Most Popular" badge can float above the table */}
        <div className="rounded-xl border border-slate-200 shadow-sm bg-white" style={{ overflow: 'visible' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>

              {/* Badge row — only priority cell has content */}
              <tr>
                <td style={{ width: '35%',    padding: 0, border: 0 }} />
                <td style={{ width: '21.67%', padding: 0, border: 0 }} />
                <td style={{ width: '21.67%', padding: '0 0 6px 0', border: 0, textAlign: 'center' }}>
                  <span
                    className="inline-block text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: PRIMARY }}
                  >
                    Most Popular
                  </span>
                </td>
                <td style={{ width: '21.67%', padding: 0, border: 0 }} />
              </tr>

              {/* Card header row */}
              <tr>
                {/* Empty feature-label header */}
                <th style={{ padding: 0, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }} />

                {/* Standard */}
                <th style={{ padding: 0, verticalAlign: 'top', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="p-4 text-left">
                    <p className="text-xs font-bold mb-0.5 font-['Manrope']" style={{ color: PRIMARY }}>Standard</p>
                    <p className="text-[11px] mb-3" style={{ color: '#94a3b8' }}>For first-time buyers and sellers</p>
                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span className="text-2xl font-extrabold font-['Manrope']" style={{ color: '#1e293b' }}>${prices.standard}</span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>/mo</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: '#94a3b8' }}>Billed {isAnnual ? 'annually' : 'monthly'}</p>
                    <button
                      onClick={() => handleCheckout(priceKey('standard'))}
                      disabled={!!loading}
                      className="w-full py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                      style={{ border: `1.5px solid #cbd5e1`, color: '#334155', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {loading === priceKey('standard') ? 'Loading…' : 'Get Started'}
                    </button>
                  </div>
                </th>

                {/* Priority */}
                <th style={{
                  padding: 0,
                  verticalAlign: 'top',
                  background: PRIORITY_BG,
                  ...pBorderSides,
                  ...pBorderTop,
                  borderBottom: `1px solid ${PRIMARY}`,
                }}>
                  <div className="p-4 text-left">
                    <p className="text-xs font-bold mb-0.5 font-['Manrope']" style={{ color: PRIMARY }}>Priority</p>
                    <p className="text-[11px] mb-3" style={{ color: '#4d7a64' }}>For active, experienced buyers and sellers</p>
                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span className="text-2xl font-extrabold font-['Manrope']" style={{ color: PRIMARY }}>${prices.priority}</span>
                      <span className="text-xs" style={{ color: '#4d7a64' }}>/mo</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: '#4d7a64' }}>Billed {isAnnual ? 'annually' : 'monthly'}</p>
                    <button
                      onClick={() => handleCheckout(priceKey('priority'))}
                      disabled={!!loading}
                      className="w-full py-1.5 text-xs font-bold rounded-lg transition-opacity disabled:opacity-60"
                      style={{ background: PRIMARY, color: '#fff', border: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      {loading === priceKey('priority') ? 'Loading…' : 'Get Started'}
                    </button>
                  </div>
                </th>

                {/* Exclusive */}
                <th style={{ padding: 0, verticalAlign: 'top', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="p-4 text-left">
                    <p className="text-xs font-bold mb-0.5 font-['Manrope']" style={{ color: PRIMARY }}>Exclusive</p>
                    <p className="text-[11px] mb-3" style={{ color: '#94a3b8' }}>For high-volume sellers and firms</p>
                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span className="text-2xl font-extrabold font-['Manrope']" style={{ color: '#1e293b' }}>${prices.exclusive}</span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>/mo</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: '#94a3b8' }}>Billed {isAnnual ? 'annually' : 'monthly'}</p>
                    <button
                      onClick={() => handleCheckout(priceKey('exclusive'))}
                      disabled={!!loading}
                      className="w-full py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                      style={{ border: `1.5px solid #cbd5e1`, color: '#334155', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {loading === priceKey('exclusive') ? 'Loading…' : 'Get Started'}
                    </button>
                  </div>
                </th>
              </tr>

            </thead>

            <tbody>
              {SECTIONS.map((section, si) => {
                const isLastSection = si === SECTIONS.length - 1;
                return (
                  <>
                    {/* Section header — uniform across all columns */}
                    <tr key={`s-${si}`}>
                      <td
                        colSpan={4}
                        style={{
                          background: SECTION_BG,
                          borderTop: '1px solid #e2e8f0',
                          padding: '4px 16px',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#94a3b8',
                        }}
                      >
                        {section.label}
                      </td>
                    </tr>

                    {/* Feature rows */}
                    {section.features.map((feature, fi) => {
                      featureIndex++;
                      const isLast = isLastSection && fi === section.features.length - 1;
                      return (
                        <tr key={`f-${si}-${fi}`}>
                          {/* Feature name */}
                          <td style={{
                            padding: '7px 16px',
                            borderTop: '1px solid #f1f5f9',
                            borderRight: '1px solid #e2e8f0',
                            color: '#64748b',
                            fontWeight: 500,
                            fontSize: '13px',
                            ...(isLast ? { borderBottomLeftRadius: '12px' } : {}),
                          }}>
                            {feature.name}
                          </td>

                          {/* Standard */}
                          <td style={{
                            padding: '7px 0',
                            borderTop: '1px solid #f1f5f9',
                            borderRight: '1px solid #e2e8f0',
                            textAlign: 'center',
                          }}>
                            {feature.standard
                              ? <span className="material-symbols-outlined text-sm" style={{ color: '#22c55e' }}>check_circle</span>
                              : <span className="material-symbols-outlined text-sm" style={{ color: '#cbd5e1' }}>remove</span>}
                          </td>

                          {/* Priority */}
                          <td style={{
                            padding: '7px 0',
                            borderTop: '1px solid #d1e8dc',
                            textAlign: 'center',
                            background: PRIORITY_BG,
                            ...pBorderSides,
                            ...(isLast ? pBorderBottom : {}),
                          }}>
                            {feature.priority
                              ? <span className="material-symbols-outlined text-sm" style={{ color: PRIMARY }}>check_circle</span>
                              : <span className="material-symbols-outlined text-sm" style={{ color: '#a7c4b5' }}>remove</span>}
                          </td>

                          {/* Exclusive */}
                          <td style={{
                            padding: '7px 0',
                            borderTop: '1px solid #f1f5f9',
                            borderLeft: '1px solid #e2e8f0',
                            textAlign: 'center',
                            ...(isLast ? { borderBottomRightRadius: '12px' } : {}),
                          }}>
                            {feature.exclusive
                              ? <span className="material-symbols-outlined text-sm" style={{ color: '#22c55e' }}>check_circle</span>
                              : <span className="material-symbols-outlined text-sm" style={{ color: '#cbd5e1' }}>remove</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8" style={{ background: PRIMARY }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <div>
            <div className="text-2xl font-bold text-white mb-3 tracking-tight font-['Manrope']">LotScout</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>&copy; 2024 LotScout Digital Cartography. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end">
            {['Terms of Service', 'Privacy Policy', 'Data Sources', 'Contact Support'].map(link => (
              <a key={link} className="text-sm font-medium transition-opacity hover:opacity-100" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }} href="#">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
