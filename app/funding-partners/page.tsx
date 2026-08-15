'use client';

import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

export default function FundingPartnersPage() {
  const { tier, loading, isAdmin, isAtLeast } = useUserTier();

  // Priority and Exclusive (and admins) get full access
  const hasAccess = !loading && (isAdmin || isAtLeast('priority'));

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

      <main className="max-w-[1440px] mx-auto pt-28 pb-20 px-4 sm:px-8">

        {/* Page heading */}
        <header className="mb-10">
          <h1 className="font-headline text-2xl sm:text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-3">
            Funding <span className="text-emerald-600">Partners</span>
          </h1>
          <p className="text-secondary text-lg font-medium max-w-xl">
            Access exclusive financing options for your land deals
          </p>
        </header>

        {/* Upgrade notice for free/standard users */}
        {!hasAccess && (
          <div className="flex items-center gap-3 mb-8 px-5 py-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="material-symbols-outlined text-blue-600 text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <p className="text-sm text-blue-800 font-medium flex-1">
              Funding partner details are available on the{' '}
              <span className="font-bold">Priority</span> and{' '}
              <span className="font-bold">Exclusive</span> plans.
            </p>
            <a
              href="/pricing"
              className="shrink-0 text-xs font-bold text-blue-800 underline hover:text-blue-900 whitespace-nowrap"
            >
              Upgrade your plan →
            </a>
          </div>
        )}

        {/* Section heading */}
        <h2 className="font-headline text-xl font-bold text-primary mb-5">Business Credit &amp; Capital</h2>

        {/* Partner cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">

          {/* Zero Interest Mastery */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all">

            {/* Category badge — always visible */}
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-700 text-white">
                Business Credit &amp; Capital
              </span>
            </div>

            {/* Company name — blurred for locked users */}
            <h3
              className={`font-headline text-lg font-extrabold text-[#012d1d] mb-1 leading-tight transition-all ${
                !hasAccess ? 'blur-sm select-none pointer-events-none' : ''
              }`}
            >
              Zero Interest Mastery
            </h3>

            {/* Contact — blurred for locked users */}
            <p
              className={`text-secondary text-sm mb-4 transition-all ${
                !hasAccess ? 'blur-sm select-none pointer-events-none' : ''
              }`}
            >
              0% Interest Funding
            </p>

            {/* Description — always visible to entice upgrade */}
            <p className="text-secondary text-sm leading-relaxed flex-1 mb-5">
              0% interest funding strategies for land investors looking to increase buying power.
            </p>

            {/* CTA — locked state for non-access users */}
            {hasAccess ? (
              <a
                href="https://zerointerestmastery.com?fpr=bobby90"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#012d1d] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#012d1d]/90 transition-colors"
              >
                Get Started
              </a>
            ) : (
              <a
                href="/pricing"
                className="flex items-center justify-center gap-2 bg-surface-container-high text-secondary font-bold text-sm py-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                Upgrade to Access
              </a>
            )}
          </div>

          {/* Let's Get Funded */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all">

            {/* Category badge — always visible */}
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-700 text-white">
                Business Credit &amp; Capital
              </span>
            </div>

            {/* Company name — blurred for locked users */}
            <h3
              className={`font-headline text-lg font-extrabold text-[#012d1d] mb-1 leading-tight transition-all ${
                !hasAccess ? 'blur-sm select-none pointer-events-none' : ''
              }`}
            >
              Let's Get Funded
            </h3>

            {/* Contact — blurred for locked users */}
            <p
              className={`text-secondary text-sm mb-4 transition-all ${
                !hasAccess ? 'blur-sm select-none pointer-events-none' : ''
              }`}
            >
              Evan Rugan
            </p>

            {/* Description — always visible to entice upgrade */}
            <p className="text-secondary text-sm leading-relaxed flex-1 mb-5">
              0% interest business credit cards for land investors and developers.
            </p>

            {/* CTA — locked state for non-access users */}
            {hasAccess ? (
              <a
                href="https://affiliate.lvlgroupny.com/affil-optin-new?am_id=bobby5005"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#012d1d] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#012d1d]/90 transition-colors"
              >
                Get Started
              </a>
            ) : (
              <a
                href="/pricing"
                className="flex items-center justify-center gap-2 bg-surface-container-high text-secondary font-bold text-sm py-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                Upgrade to Access
              </a>
            )}
          </div>

          {/* Damen Capital */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all">

            {/* Category badge — always visible */}
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-700 text-white">
                Lending &amp; Note Buying
              </span>
            </div>

            {/* Company name — blurred for locked users */}
            <h3
              className={`font-headline text-lg font-extrabold text-[#012d1d] mb-1 leading-tight transition-all ${
                !hasAccess ? 'blur-sm select-none pointer-events-none' : ''
              }`}
            >
              Damen Capital
            </h3>

            {/* Contact — blurred for locked users */}
            <p
              className={`text-secondary text-sm mb-4 transition-all ${
                !hasAccess ? 'blur-sm select-none pointer-events-none' : ''
              }`}
            >
              Eric Scharaga
            </p>

            {/* Description — always visible to entice upgrade */}
            <p className="text-secondary text-sm leading-relaxed flex-1 mb-5">
              Lending and note buying for vacant land investors.
            </p>

            {/* CTA — locked state for non-access users */}
            {hasAccess ? (
              <a
                href="https://damencapital.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#012d1d] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#012d1d]/90 transition-colors"
              >
                Get Started
              </a>
            ) : (
              <a
                href="/pricing"
                className="flex items-center justify-center gap-2 bg-surface-container-high text-secondary font-bold text-sm py-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                Upgrade to Access
              </a>
            )}
          </div>
        </div>

        {/* Coming soon note */}
        <p className="mt-8 text-sm text-secondary">
          More funding partners coming soon. Have a partner to recommend?{' '}
          <a href="mailto:support@lotscout.com" className="text-primary font-semibold hover:underline">
            Contact us at support@lotscout.com
          </a>
        </p>

      </main>
    </div>
  );
}
