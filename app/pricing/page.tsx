'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';

const GRID = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr' } as const;
const GRID5 = { display: 'grid', gridTemplateColumns: '28px 1.5fr 1fr 1fr 1fr' } as const;
const GRID5 = { display: 'grid', gridTemplateColumns: '28px 1.5fr 1fr 1fr 1fr' } as const;

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
  const [userTier, setUserTier] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      if (data?.tier) setUserTier(data.tier);
    });
  }, []);

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
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight">Platform <span className="text-emerald-600">Pricing</span></h1>
        </header>

        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">

          {/* ── Column headers ── */}
          <div style={GRID5} className="border-b border-outline-variant/10">
            {/* Empty label column */}
            <div />

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
              <div className="flex items-center gap-2 mb-2">
                <span className="text-secondary font-bold text-sm tracking-widest">STANDARD</span>
                {userTier === 'standard' && (
                  <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter leading-none">Current Plan</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.standard}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingLabel}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('standard'))}
                disabled={!!loading || userTier === 'standard'}
                className={`mt-auto w-full py-3 px-4 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${userTier === 'standard' ? 'bg-surface-container-high text-secondary cursor-default' : 'border border-outline text-primary hover:bg-surface-container-low'}`}
              >
                {userTier === 'standard' ? 'Current Plan' : loading === getPriceKey('standard') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Priority */}
            <div className="p-5 flex flex-col bg-[#f0f8f4] border-l-2 border-r-2 border-primary-container relative">
              <div className="absolute -top-px left-0 right-0 h-1 bg-primary-container" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary-container font-bold text-sm tracking-widest">PRIORITY</span>
                {userTier === 'priority' ? (
                  <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter leading-none">Current Plan</span>
                ) : (
                  <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter leading-none">Most Popular</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.priority}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingLabel}</p>
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
                <span className="text-secondary font-bold text-sm tracking-widest">EXCLUSIVE</span>
                {userTier === 'exclusive' && (
                  <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter leading-none">Current Plan</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-primary font-headline">${prices.exclusive}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingLabel}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('exclusive'))}
                disabled={!!loading || userTier === 'exclusive'}
                className={`mt-auto w-full py-3 px-4 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${userTier === 'exclusive' ? 'bg-surface-container-high text-secondary cursor-default' : 'border border-outline text-primary hover:bg-surface-container-low'}`}
              >
                {userTier === 'exclusive' ? 'Current Plan' : loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* ── Feature sections ── */}
          {/* Outer wrapper: relative so Priority overlay border can be absolute */}
          <div className="relative">

            {/* Priority column full-height border overlay */}
            <div
              className="absolute inset-y-0 pointer-events-none border-2 border-primary rounded-xl z-10"
              style={{ left: 'calc(28px + 1.5fr + 1fr)', right: '1fr' }}
            />

            {/* We use JS to measure — instead use a CSS approach with grid positioning */}
            {/* Priority overlay via pseudo-positioned sibling — use col-start trick */}
            {SECTIONS.map((section, si) => (
              <div key={si}>
                {section.features.map((feature, fi) => (
                  <div
                    key={fi}
                    style={GRID5}
                    className={si === 0 && fi === 0 ? 'border-t border-outline-variant/10' : 'border-t border-outline-variant/5'}
                  >
                    {/* Narrow label column — only show on first row of each section */}
                    <div className="flex items-center justify-center">
                      {fi === 0 && (
                        <div
                          className="flex items-center justify-center border-l-2 border-primary"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: `${section.features.length * 40}px`, marginTop: 0 }}
                        >
                          <span className="text-[9px] font-black text-primary tracking-widest uppercase leading-none whitespace-nowrap">
                            {section.label}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Feature name */}
                    <div className="py-2 pl-4 pr-4 flex items-center">
                      <span className="text-sm text-secondary">{feature.name}</span>
                    </div>
                    {/* Standard */}
                    <div className="py-2 px-4 flex justify-center items-center border-l border-outline-variant/10">
                      {feature.standard ? <Check muted /> : <Dash />}
                    </div>
                    {/* Priority */}
                    <div className={`py-2 px-4 flex justify-center items-center bg-[#f0f8f4] border-l-2 border-r-2 border-primary/20 ${si === 0 && fi === 0 ? 'border-t-2 border-t-primary' : ''} ${si === SECTIONS.length - 1 && fi === section.features.length - 1 ? 'border-b-2 border-b-primary rounded-b-lg' : ''}`}>
                      {feature.priority ? <Check /> : <Dash />}
                    </div>
                    {/* Exclusive */}
                    <div className="py-2 px-4 flex justify-center items-center border-l border-outline-variant/10">
                      {feature.exclusive ? <Check /> : <Dash />}
                    </div>
                  </div>
                ))}
              </div>
            ))}
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
