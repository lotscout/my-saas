'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

// Shared responsive grid: feature-label column + 3 tier columns.
// fr units always fit the container width, so the table never overflows horizontally.
const GRID_CLS = 'grid grid-cols-[1.5fr_1fr_1fr_1fr]';

// Full feature list — every tier shows all rows; unavailable rows render dimmed.
const FEATURES = [
  { name: 'Land Marketplace Access',                         standard: true,  priority: true,  exclusive: true  },
  { name: 'Lot to Buyer Match AI',                           standard: true,  priority: true,  exclusive: true  },
  { name: 'Custom Company Profile',                          standard: true,  priority: true,  exclusive: true  },
  { name: 'Buyer Directory Access',                          standard: true,  priority: true,  exclusive: true  },
  { name: 'Property Analysis Reports',                       standard: true,  priority: true,  exclusive: true  },
  { name: 'Lot Analysis Reports',                            standard: true,  priority: true,  exclusive: true  },
  { name: 'Unlimited Listings',                              standard: false, priority: true,  exclusive: true  },
  { name: 'Promoted Lot Requests',                           standard: false, priority: true,  exclusive: true  },
  { name: 'Financing Partners Access',                       standard: false, priority: true,  exclusive: true  },
  { name: '24/7 Support',                                    standard: false, priority: true,  exclusive: true  },
  { name: 'Dedicated Full-Time Account Manager',             standard: false, priority: false, exclusive: true  },
  { name: 'Early Access to New Listings Before Anyone Else', standard: false, priority: false, exclusive: true  },
  { name: 'Early Access to New Buyers Before Anyone Else',   standard: false, priority: false, exclusive: true  },
  { name: 'Hands-On Listing Support and Deal Guidance',      standard: false, priority: false, exclusive: true  },
  { name: 'White-Glove Onboarding and Setup',                standard: false, priority: false, exclusive: true  },
  { name: 'Priority Deal Matching with Top-Tier Buyers',     standard: false, priority: false, exclusive: true  },
  { name: 'Quarterly Market Intelligence Reports',           standard: false, priority: false, exclusive: true  },
  { name: "Direct Line to LotScout's Land Experts",          standard: false, priority: false, exclusive: true  },
];

function Check() {
  return (
    <span
      className="material-symbols-outlined text-primary"
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      check_circle
    </span>
  );
}

function Dash() {
  return <span className="text-outline-variant text-base">—</span>;
}

// Monthly = round(annual x 7/6) to preserve the existing "2 months free" annual
// discount. Standard is unchanged; priority/enterprise repriced to $199/$529 annual.
const ANNUAL_PRICES  = { standard: 97,  priority: 199, exclusive: 529 };
const MONTHLY_PRICES = { standard: 113, priority: 232, exclusive: 617 };

// Full feature list rendered in every mobile pricing card. Features not included
// in the tier are dimmed (opacity-40) with a dash instead of a green check.
function TierFeatures({ tier, dark = false }: { tier: 'standard' | 'priority' | 'exclusive'; dark?: boolean }) {
  return (
    <ul className="mt-5 space-y-3">
      {FEATURES.map((f) => {
        const included = f[tier] === true;
        return (
          <li
            key={f.name}
            className={`flex items-center gap-3 text-sm ${dark ? 'text-emerald-50' : 'text-on-surface'} ${included ? '' : 'opacity-40'}`}
          >
            <span
              className={`material-symbols-outlined text-xl ${included ? (dark ? 'text-emerald-300' : 'text-emerald-600') : (dark ? 'text-emerald-200' : 'text-secondary')}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {included ? 'check_circle' : 'remove'}
            </span>
            {f.name}
          </li>
        );
      })}
    </ul>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
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
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-grow pt-20 pb-4 px-4 sm:px-6 max-w-6xl mx-auto w-full">

        {/* ── Mobile stacked tier cards ── */}
        <div className="md:hidden space-y-5">
          {/* Billing toggle (shares isAnnual with the desktop table) */}
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center p-1 bg-surface-container-high rounded-full">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${!isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary'}`}
              >
                Annual
              </button>
            </div>
            <span className="text-emerald-700 text-xs font-bold text-center">Get two months free when switching to annual</span>
          </div>

          {/* STANDARD */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 shadow-sm">
            <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-2">Standard</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-extrabold text-primary font-headline">${prices.standard}</span>
              <span className="text-secondary font-medium text-sm">/mo</span>
            </div>
            <p className="text-xs text-secondary/70 mb-4">{billingSubtext()}</p>
            <button
              onClick={() => handleCheckout(getPriceKey('standard'))}
              disabled={!!loading || userTier === 'standard'}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${userTier === 'standard' ? 'bg-surface-container-high text-secondary cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              {userTier === 'standard' ? 'Current Plan' : loading === getPriceKey('standard') ? 'Loading…' : 'Get Started'}
            </button>
            <TierFeatures tier="standard" />
          </div>

          {/* PRIORITY — Most Popular */}
          <div className="rounded-3xl p-6 shadow-lg relative text-white" style={{ backgroundColor: '#1b4332' }}>
            <span className="absolute top-5 right-5 bg-emerald-400 text-emerald-950 text-[10px] font-black px-3 py-1 rounded-full tracking-wide uppercase">Most Popular</span>
            <p className="text-emerald-200 font-bold text-sm tracking-widest uppercase mb-2">Priority</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-extrabold text-white font-headline">${prices.priority}</span>
              <span className="text-emerald-200 font-medium text-sm">/mo</span>
            </div>
            <p className="text-xs text-emerald-200/70 mb-4">{billingSubtext()}</p>
            <button
              onClick={() => handleCheckout(getPriceKey('priority'))}
              disabled={!!loading || userTier === 'priority'}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${userTier === 'priority' ? 'bg-emerald-900 text-emerald-200 cursor-default' : 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200'}`}
            >
              {userTier === 'priority' ? 'Current Plan' : loading === getPriceKey('priority') ? 'Loading…' : 'Get Started'}
            </button>
            <TierFeatures tier="priority" dark />
          </div>

          {/* EXCLUSIVE */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 shadow-sm">
            <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-2">Enterprise</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-extrabold text-primary font-headline">${prices.exclusive}</span>
              <span className="text-secondary font-medium text-sm">/mo</span>
            </div>
            <p className="text-xs text-secondary/70 mb-4">{billingSubtext()}</p>
            <button
              onClick={() => handleCheckout(getPriceKey('exclusive'))}
              disabled={!!loading || userTier === 'exclusive'}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-60 ${userTier === 'exclusive' ? 'bg-surface-container-high text-secondary cursor-default' : 'hover:opacity-90'}`}
              style={userTier === 'exclusive' ? undefined : { backgroundColor: '#1b4332' }}
            >
              {userTier === 'exclusive' ? 'Current Plan' : loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Started'}
            </button>
            <TierFeatures tier="exclusive" />
          </div>
        </div>

        {/* ── Desktop comparison table ── */}
        <div className="hidden md:block bg-white rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">

          {/* ── Header row ── */}
          <div className={`${GRID_CLS} border-b border-outline-variant/10`}>

            {/* Top-left: billing toggle */}
            <div className="p-5 flex flex-col justify-center gap-2">
              <div className="inline-flex items-center p-1 bg-surface-container-high rounded-full self-start">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    !isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                  }`}
                >
                  Annual
                </button>
              </div>
              <span className="text-green-700 text-xs font-bold pl-1">Get 2 months free with annual billing</span>
            </div>

            {/* Standard */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <span className="text-secondary font-bold text-xs tracking-widest uppercase mb-2">Standard</span>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-primary font-headline">${prices.standard}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext()}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('standard'))}
                disabled={!!loading || userTier === 'standard'}
                className={`mt-auto w-full py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${
                  userTier === 'standard'
                    ? 'bg-surface-container-high text-secondary cursor-default'
                    : 'border-2 border-primary text-primary hover:bg-primary/5'
                }`}
              >
                {userTier === 'standard' ? 'Current Plan' : loading === getPriceKey('standard') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Priority — highlighted */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10 bg-primary-container/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary font-bold text-xs tracking-widest uppercase">Priority</span>
                {userTier === 'priority' ? (
                  <span className="text-secondary text-xs font-semibold">Current Plan</span>
                ) : (
                  <span className="bg-green-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wide uppercase">Most Popular</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-primary font-headline">${prices.priority}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext()}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('priority'))}
                disabled={!!loading || userTier === 'priority'}
                className={`mt-auto w-full py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${
                  userTier === 'priority'
                    ? 'bg-surface-container-high text-secondary cursor-default'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                {userTier === 'priority' ? 'Current Plan' : loading === getPriceKey('priority') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Exclusive */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <span className="text-secondary font-bold text-xs tracking-widest uppercase mb-2">Enterprise</span>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-primary font-headline">${prices.exclusive}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext()}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('exclusive'))}
                disabled={!!loading || userTier === 'exclusive'}
                className={`mt-auto w-full py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${
                  userTier === 'exclusive'
                    ? 'bg-surface-container-high text-secondary cursor-default'
                    : 'border-2 border-primary text-primary hover:bg-primary/5'
                }`}
              >
                {userTier === 'exclusive' ? 'Current Plan' : loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* ── Feature rows ── */}
          {FEATURES.map((feature, fi) => {
            const cell = (val: boolean | string) =>
              typeof val === 'string'
                ? <span className="text-sm font-bold text-primary">{val}</span>
                : val ? <Check /> : <Dash />;
            return (
              <div
                key={fi}
                className={`${GRID_CLS} border-t border-outline-variant/5 hover:bg-surface-container-lowest transition-colors`}
              >
                <div className="py-3 pl-8 pr-4 text-sm font-medium text-on-surface flex items-center">
                  {feature.name}
                </div>
                <div className="py-3 px-4 flex justify-center items-center border-l border-outline-variant/10">
                  {cell(feature.standard)}
                </div>
                <div className="py-3 px-4 flex justify-center items-center border-l border-outline-variant/10 bg-primary-container/5">
                  {cell(feature.priority)}
                </div>
                <div className="py-3 px-4 flex justify-center items-center border-l border-outline-variant/10">
                  {cell(feature.exclusive)}
                </div>
              </div>
            );
          })}

        </div>

        {/* Enterprise / custom solution */}
        <div className="mt-8 bg-surface-container-low rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="font-headline text-lg font-bold text-primary mb-1">Need a custom solution?</h3>
            <p className="text-secondary text-sm">Large brokerage or enterprise team? Let&apos;s build a plan that fits your volume.</p>
          </div>
          <a
            href="mailto:support@lotscout.com"
            className="shrink-0 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            Contact Sales
          </a>
        </div>

        {/* ── Search Pro Add-On ── */}
        <div className="mt-8 rounded-2xl overflow-hidden shadow-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
            {/* Left: icon + name */}
            <div className="flex items-center gap-3 min-w-[160px]">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-none">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-0.5">Add-On</div>
                <div className="font-headline text-lg font-extrabold text-primary">Search Pro</div>
              </div>
            </div>

            {/* Middle: price + description + features */}
            <div className="flex-grow">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-extrabold text-primary font-headline">$20</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              <p className="text-sm text-secondary mb-2">
                Unlimited AI Search questions and saved reports. Ask our land investment advisor anything, as much as you want.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {[
                  'Unlimited Search questions',
                  'Save reports and conversations',
                  'Full access to the AI Land Advisor',
                ].map((f) => (
                  <span key={f} className="flex items-center gap-1.5 text-xs text-secondary">
                    <span className="material-symbols-outlined text-emerald-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {f}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-700 font-semibold">
                ✦ Included free with any LotScout paid plan (Standard, Priority, or Exclusive).
              </p>
            </div>

            {/* Right: CTA */}
            <div className="flex-none">
              <button
                onClick={() => handleCheckout('searchProMonthly')}
                disabled={!!loading}
                className="py-2.5 px-6 font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
              >
                {loading === 'searchProMonthly' ? 'Loading…' : 'Get Search Pro'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 w-full py-4 px-8 mt-auto text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center max-w-7xl mx-auto">
          <div>
            <div className="text-xl font-bold text-emerald-50 mb-2 font-headline">LotScout</div>
            <p className="text-emerald-300/60 leading-relaxed max-w-sm">
              Precision cartography tools for the next generation of land acquisition experts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Terms of Service</a>
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Privacy Policy</a>
            </div>
            <div className="space-y-2">
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Data Sources</a>
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Contact Support</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-emerald-900 mt-4 pt-3 text-center text-emerald-200/40">
          © 2024 LotScout Digital Cartography. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
