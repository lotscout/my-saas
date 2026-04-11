'use client';

import { useState } from 'react';
import Header from '@/components/Header';

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
        window.location.href = data.url;
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
  return (
    <div className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body">
      <Header />

      <main className="pt-32 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="text-center mb-20">
          <h1 className="text-7xl md:text-8xl font-extrabold text-primary mb-8 font-headline">Pricing</h1>
          <p className="text-secondary text-2xl md:text-3xl max-w-4xl mx-auto mb-12 opacity-80">
            Transparent pricing for the next generation of land developers, investors, and firms.
          </p>
          {/* Billing Toggle */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-surface-container-low p-2 rounded-full flex items-center gap-2 border border-outline/10">
              <button
                className={`px-12 py-3.5 rounded-full text-base font-bold transition-all ${!isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                onClick={() => setIsAnnual(false)}
              >Monthly</button>
              <button
                className={`px-12 py-3.5 rounded-full text-base font-bold transition-all ${isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                onClick={() => setIsAnnual(true)}
              >Annual</button>
            </div>
            <span className="text-primary-container font-bold text-sm tracking-widest uppercase bg-primary-fixed px-6 py-2 rounded-full">Get two months free when switching to annual billing</span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          {/* Tier 1: Standard — light gray/neutral */}
          <div className="bg-slate-50 rounded-2xl p-10 flex flex-col h-full transition-all border border-slate-200 hover:shadow-lg">
            <div className="mb-8">
              <h3 className="text-4xl font-extrabold text-slate-700 mb-1 font-headline">Standard</h3>
              <p className="text-slate-500 text-xl whitespace-nowrap overflow-hidden text-ellipsis mb-8">For first-time buyers and sellers</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-6xl font-extrabold text-slate-800">${prices.standard}</span>
                <span className="text-slate-400 text-2xl font-medium">/mo</span>
              </div>
              <p className="text-slate-400 text-xl font-medium">{billingLabel}</p>
            </div>
            <div className="h-px bg-slate-200 w-full mb-8"></div>
            <ul className="space-y-4 mb-14 flex-grow">
              <li className="flex items-center gap-4 text-slate-700 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-500">check</span>
                <span>Land Marketplace Access</span>
              </li>
              <li className="flex items-center gap-4 text-slate-700 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-500">check</span>
                <span>Lot to Buyer Match AI</span>
              </li>
              <li className="flex items-center gap-4 text-slate-700 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-500">check</span>
                <span>Custom Company Profile</span>
              </li>
              <li className="flex items-center gap-4 text-slate-700 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-500">check</span>
                <span>Lot Analysis Reports</span>
              </li>
              <li className="flex items-center gap-4 text-slate-700 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-500">check</span>
                <span>Buyer Directory Access</span>
              </li>
              <li className="flex items-center gap-4 text-slate-700 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-500">check</span>
                <span>Property Analysis Reports</span>
              </li>
              <li className="flex items-center gap-4 text-slate-300 font-medium text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl">remove</span>
                <span>Unlimited Listings</span>
              </li>
              <li className="flex items-center gap-4 text-slate-300 font-medium text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl">remove</span>
                <span>Promoted Lot Requests</span>
              </li>
              <li className="flex items-center gap-4 text-slate-300 font-medium text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl">remove</span>
                <span>Financing Partners Access</span>
              </li>
              <li className="flex items-center gap-4 text-slate-300 font-medium text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl">remove</span>
                <span>24/7 Support</span>
              </li>
            </ul>
            <button
              onClick={() => handleCheckout(isAnnual ? 'standardAnnual' : 'standardMonthly')}
              disabled={!!loading}
              className="w-full py-5 text-xl border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              {loading === (isAnnual ? 'standardAnnual' : 'standardMonthly') ? 'Loading…' : 'Get Started'}
            </button>
          </div>

          {/* Tier 2: Priority — rich green, most popular */}
          <div className="bg-emerald-600 rounded-2xl p-10 flex flex-col h-full relative shadow-2xl shadow-emerald-700/40 scale-105 z-10">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-950 text-emerald-50 text-xs font-black px-8 py-3 rounded-full uppercase tracking-[0.2em] shadow-lg whitespace-nowrap">Most Popular</div>
            <div className="mb-8 mt-4">
              <h3 className="text-4xl font-extrabold text-white mb-1 font-headline">Priority</h3>
              <p className="text-emerald-100/80 text-xl whitespace-nowrap overflow-hidden text-ellipsis mb-8">For active, experienced buyers and sellers</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-6xl font-extrabold text-white">${prices.priority}</span>
                <span className="text-emerald-200 text-2xl font-medium">/mo</span>
              </div>
              <p className="text-emerald-200 text-xl font-medium">{billingLabel}</p>
            </div>
            <div className="h-px bg-white/20 w-full mb-8"></div>
            <ul className="space-y-4 mb-14 flex-grow">
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Land Marketplace Access</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Lot to Buyer Match AI</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Custom Company Profile</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Lot Analysis Reports</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Buyer Directory Access</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Property Analysis Reports</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Unlimited Listings</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Promoted Lot Requests</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>Financing Partners Access</span>
              </li>
              <li className="flex items-center gap-4 text-white font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-200">check</span>
                <span>24/7 Support</span>
              </li>
            </ul>
            <button
              onClick={() => handleCheckout(isAnnual ? 'priorityAnnual' : 'priorityMonthly')}
              disabled={!!loading}
              className="w-full py-5 text-xl bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg disabled:opacity-60"
            >
              {loading === (isAnnual ? 'priorityAnnual' : 'priorityMonthly') ? 'Loading…' : 'Get Started'}
            </button>
          </div>

          {/* Tier 3: Exclusive — dark premium */}
          <div className="bg-emerald-950 rounded-2xl p-10 flex flex-col h-full transition-all border border-emerald-800/50 hover:shadow-2xl hover:shadow-emerald-950/50">
            <div className="mb-8">
              <h3 className="text-4xl font-extrabold text-emerald-50 mb-1 font-headline">Exclusive</h3>
              <p className="text-emerald-400/70 text-xl whitespace-nowrap overflow-hidden text-ellipsis mb-8">For high-volume sellers and firms</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-6xl font-extrabold text-emerald-50">${prices.exclusive}</span>
                <span className="text-emerald-400 text-2xl font-medium">/mo</span>
              </div>
              <p className="text-emerald-400 text-xl font-medium">{billingLabel}</p>
            </div>
            <div className="h-px bg-emerald-800/50 w-full mb-8"></div>
            <ul className="space-y-4 mb-14 flex-grow">
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Land Marketplace Access</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Lot to Buyer Match AI</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Custom Company Profile</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Lot Analysis Reports</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Buyer Directory Access</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Property Analysis Reports</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Unlimited Listings</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Promoted Lot Requests</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Financing Partners Access</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>24/7 Support</span>
              </li>
              <li className="flex items-center gap-4 text-emerald-100 font-bold text-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-2xl text-emerald-400">check</span>
                <span>Hands-On Listing Support</span>
              </li>
            </ul>
            <button
              onClick={() => handleCheckout(isAnnual ? 'exclusiveAnnual' : 'exclusiveMonthly')}
              disabled={!!loading}
              className="w-full py-5 text-xl bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-black/30 disabled:opacity-60"
            >
              {loading === (isAnnual ? 'exclusiveAnnual' : 'exclusiveMonthly') ? 'Loading…' : 'Get Started'}
            </button>
          </div>

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
