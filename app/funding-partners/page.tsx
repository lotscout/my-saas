'use client';

import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

export default function FundingPartnersPage() {
  const { tier, loading, isAdmin, isAtLeast } = useUserTier();

  const isExclusive = !loading && (isAdmin || isAtLeast('exclusive'));

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
            {/* Section heading */}
            <h2 className="font-headline text-xl font-bold text-primary mb-5">Business Credit &amp; Capital</h2>

            {/* Partner card */}
            <div className="max-w-sm">
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col hover:shadow-lg hover:border-primary/20 transition-all">

                {/* Category badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                    Business Credit &amp; Capital
                  </span>
                </div>

                {/* Company name */}
                <h3 className="font-headline text-lg font-extrabold text-[#012d1d] mb-1 leading-tight">
                  Let's Get Funded
                </h3>

                {/* Contact */}
                <p className="text-secondary text-sm mb-4">Evan Rugan</p>

                {/* Description */}
                <p className="text-secondary text-sm leading-relaxed flex-1 mb-5">
                  0% interest business credit cards for land investors and developers.
                </p>

                {/* CTA */}
                <a
                  href="https://affiliate.lvlgroupny.com/affil-optin-new?am_id=bobby5005"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#012d1d] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#012d1d]/90 transition-colors"
                >
                  Get Started
                </a>
              </div>
            </div>

            {/* Coming soon note */}
            <p className="mt-8 text-sm text-secondary">
              More funding partners coming soon. Have a partner to recommend?{' '}
              <a href="mailto:support@lotscout.com" className="text-primary font-semibold hover:underline">
                Contact us at support@lotscout.com
              </a>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
