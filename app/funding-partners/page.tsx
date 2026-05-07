'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

type FundingCategory = 'all' | 'zero-interest' | 'short-term' | 'development';

interface Partner {
  id: string;
  name: string;
  category: Exclude<FundingCategory, 'all'>;
  loanRange: string;
  termLength: string;
  description: string;
}

const PARTNERS: Partner[] = [
  {
    id: 'landbridge',
    name: 'LandBridge Capital',
    category: 'zero-interest',
    loanRange: '$100K – $2M',
    termLength: '12 months intro',
    description: '0% intro rate for 12 months on qualified land purchases. Designed for buyers with strong credit profiles seeking competitive acquisition financing.',
  },
  {
    id: 'greenfield',
    name: 'Greenfield Finance Group',
    category: 'zero-interest',
    loanRange: '$50K – $1M',
    termLength: '6 months',
    description: 'Zero-interest bridge funding for off-market land acquisitions. Fast approval process with flexible terms for time-sensitive deals.',
  },
  {
    id: 'terrain',
    name: 'Terrain Lending',
    category: 'short-term',
    loanRange: '$75K – $5M',
    termLength: '12 – 36 months',
    description: 'Fast-close land loans funded in 7–14 days. No prepayment penalty. Ideal for competitive acquisitions where speed is critical.',
  },
  {
    id: 'apex',
    name: 'Apex Land Capital',
    category: 'short-term',
    loanRange: '$100K – $3M',
    termLength: '6 – 24 months',
    description: 'Hard money land loans for investors and developers. Rates from 8.9%. Quick decisions and flexible underwriting for non-conventional deals.',
  },
  {
    id: 'buildright',
    name: 'BuildRight Funding',
    category: 'development',
    loanRange: '$250K – $10M',
    termLength: '12 – 24 months',
    description: 'Ground-up construction and land development loans with draw schedules. Experienced development lenders who understand the full project lifecycle.',
  },
  {
    id: 'pioneer',
    name: 'Pioneer Development Finance',
    category: 'development',
    loanRange: '$500K – $20M',
    termLength: 'Flexible',
    description: 'Subdivision and development financing with flexible draw terms and interest-only periods. Built for large-scale land development projects.',
  },
];

const FILTERS: { label: string; value: FundingCategory }[] = [
  { label: 'All', value: 'all' },
  { label: '0% Interest Funding', value: 'zero-interest' },
  { label: 'Short Term Land Loans', value: 'short-term' },
  { label: 'Development & Construction', value: 'development' },
];

const BADGE: Record<Exclude<FundingCategory, 'all'>, { label: string; cls: string }> = {
  'zero-interest': { label: '0% Interest', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'short-term':    { label: 'Short Term',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'development':   { label: 'Development & Construction', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export default function FundingPartnersPage() {
  const { tier, loading, isAdmin, isAtLeast } = useUserTier();
  const [activeFilter, setActiveFilter] = useState<FundingCategory>('all');

  const isExclusive = !loading && (isAdmin || isAtLeast('exclusive'));

  const filtered = activeFilter === 'all'
    ? PARTNERS
    : PARTNERS.filter(p => p.category === activeFilter);

  if (loading) {
    return (
      <div className="bg-surface text-on-surface antialiased font-body min-h-screen">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface antialiased font-body min-h-screen">
      <Header />

      <main className="max-w-[1440px] mx-auto pt-28 pb-20 px-8">

        {/* Page heading */}
        <header className="mb-10">
          <p className="text-secondary font-medium tracking-wide uppercase text-xs mb-1">Exclusive Access</p>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-3">
            Funding <span className="text-emerald-600">Partners</span>
          </h1>
          <p className="text-secondary text-lg font-medium max-w-xl">
            Access exclusive financing options for your land deals
          </p>
        </header>

        {/* Exclusive-tier gate */}
        {!isExclusive ? (
          <div className="flex items-start justify-center pt-8">
            <div className="bg-white border border-outline-variant/20 rounded-2xl shadow-xl max-w-lg w-full p-10 text-center">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <h2 className="font-headline text-2xl font-extrabold text-primary mb-2">Exclusive Members Only</h2>
              <p className="text-secondary text-sm leading-relaxed mb-8">
                Funding Partners is available exclusively to{' '}
                <span className="font-bold text-primary">Exclusive plan</span> members. Upgrade to unlock direct access to our network of preferred land financing partners.
              </p>
              <div className="space-y-3">
                <a
                  href="/pricing"
                  className="block w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 text-sm"
                >
                  Upgrade to Exclusive →
                </a>
                {tier && (
                  <p className="text-xs text-secondary">
                    You&apos;re currently on the{' '}
                    <span className="font-semibold capitalize">{tier}</span> plan.
                  </p>
                )}
                {!tier && (
                  <p className="text-xs text-secondary">No active subscription.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 mb-8">
              {FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setActiveFilter(value)}
                  className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${
                    activeFilter === value
                      ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/15'
                      : 'bg-white text-secondary border-outline-variant/30 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Partner cards — 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(partner => {
                const badge = BADGE[partner.category];
                return (
                  <div
                    key={partner.id}
                    className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all"
                  >
                    {/* Category badge */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Company name */}
                    <h3 className="font-headline text-lg font-extrabold text-primary mb-3 leading-tight">
                      {partner.name}
                    </h3>

                    {/* Loan range + term */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">Loan Range</p>
                        <p className="text-sm font-bold text-on-surface">{partner.loanRange}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">Term Length</p>
                        <p className="text-sm font-bold text-on-surface">{partner.termLength}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-secondary text-sm leading-relaxed flex-1 mb-5">
                      {partner.description}
                    </p>

                    {/* CTA */}
                    <a
                      href="/messaging"
                      className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/15 text-primary font-bold text-sm py-2.5 rounded-xl hover:bg-primary hover:text-on-primary hover:border-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-base">chat_bubble</span>
                      Learn More
                    </a>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-4xl text-secondary/30 mb-3 block">search_off</span>
                <p className="text-secondary text-sm">No partners found for this category.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
