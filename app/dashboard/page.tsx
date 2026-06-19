'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/lib/permissions';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function matchScore(listing: any, criteria: any): number {
  let score = 70;
  if (criteria.land_type && listing.land_type && criteria.land_type === listing.land_type) score += 10;
  if (criteria.location && listing.county && listing.county.toLowerCase().includes(criteria.location.toLowerCase())) score += 10;
  if (listing.acreage != null && criteria.min_acreage != null && criteria.max_acreage != null) {
    const mid = (criteria.min_acreage + criteria.max_acreage) / 2;
    if (Math.abs(listing.acreage - mid) < mid * 0.3) score += 5;
  }
  if (listing.price != null && criteria.max_budget != null) {
    if (listing.price < criteria.max_budget * 0.8) score += 5;
  }
  return Math.min(score, 100);
}

function listingMatchesCriteria(listing: any, criteria: any): boolean {
  if (criteria.min_acreage != null && listing.acreage != null && listing.acreage < criteria.min_acreage) return false;
  if (criteria.max_acreage != null && listing.acreage != null && listing.acreage > criteria.max_acreage) return false;
  if (criteria.min_budget != null && listing.price != null && listing.price < criteria.min_budget) return false;
  if (criteria.max_budget != null && listing.price != null && listing.price > criteria.max_budget) return false;
  if (criteria.land_type && listing.land_type && criteria.land_type !== listing.land_type) return false;
  return true;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-xl ${className ?? ''}`} />;
}

const QUICK_ACTIONS = [
  { label: 'Analyze a Property', href: '/property-analysis' },
  { label: 'Browse Marketplace', href: '/marketplace' },
  { label: 'Find Buyers', href: '/buyer-directory' },
  { label: 'Create Listing', href: '/create-listing' },
  { label: 'Find a Property', href: '/marketplace' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAnalysisReady, setHasAnalysisReady] = useState(false);
  const [matchedBuyers, setMatchedBuyers] = useState<any[]>([]);
  const [newListings, setNewListings] = useState<any[]>([]);
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);
  const [marketReport, setMarketReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmittedToast, setShowSubmittedToast] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('listing_submitted')) {
      sessionStorage.removeItem('listing_submitted');
      setShowSubmittedToast(true);
      const t = setTimeout(() => setShowSubmittedToast(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, subRes, unreadRes, analysisRes, userListingsRes, userCriteriaRes] = await Promise.all([
        supabase.from('profiles').select('first_name, state, county, is_admin').eq('id', user.id).single(),
        supabase.from('subscriptions').select('tier').eq('user_id', user.id).eq('status', 'active').single(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null),
        supabase.from('property_analysis_requests').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'complete'),
        supabase.from('listings').select('id, acreage, price, county, land_type').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('buyer_criteria').select('id, location, min_acreage, max_acreage, min_budget, max_budget, land_type').eq('user_id', user.id).eq('active', true),
      ]);

      if (profileRes.data?.is_admin) {
        router.replace('/admin/dashboard');
        return;
      }

      setFirstName(
        profileRes.data?.first_name ??
        (user.user_metadata?.first_name as string | undefined) ??
        null
      );
      setTier((subRes?.data?.tier as Tier) ?? null);
      setUnreadCount(unreadRes.count ?? 0);
      setHasAnalysisReady((analysisRes.count ?? 0) > 0);

      const userState = profileRes.data?.state ?? null;
      const userListings: any[] = (userListingsRes.data as any[]) ?? [];
      const userCriteria: any[] = (userCriteriaRes.data as any[]) ?? [];

      // Matched buyers: other users' criteria that match this user's listed properties
      if (userListings.length > 0) {
        const { data: allCriteria } = await supabase
          .from('buyer_criteria')
          .select('id, user_id, location, min_acreage, max_acreage, min_budget, max_budget, land_type, buyer:user_id(first_name, last_name)')
          .eq('active', true)
          .neq('user_id', user.id);

        if (allCriteria) {
          const scored = (allCriteria as any[])
            .filter(c => userListings.some(l => listingMatchesCriteria(l, c)))
            .map(c => ({ c, score: matchScore(userListings.find(l => listingMatchesCriteria(l, c))!, c) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
          setMatchedBuyers(scored);
        }
      }

      // New listings matching user's buyer criteria
      if (userCriteria.length > 0) {
        const { data: feedListings } = await supabase
          .from('listings')
          .select('id, title, location, county, acreage, price, land_type, created_at')
          .eq('status', 'active')
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (feedListings) {
          const matched = (feedListings as any[])
            .filter(listing => userCriteria.some(c => listingMatchesCriteria(listing, c)))
            .slice(0, 4);
          setNewListings(matched);
        }
      }

      // Nearby listings by profile state (fallback for "new properties" card)
      if (userState) {
        const { data: nearbyRes } = await supabase
          .from('listings')
          .select('id, title, state, county, created_at')
          .eq('status', 'active')
          .eq('state', userState)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        setNearbyListings((nearbyRes as any[]) ?? []);
      }

      // User's most recent delivered market report
      if (user.email) {
        const { data: mrData } = await supabase
          .from('market_report_requests')
          .select('id, county, state, report_month, report_url')
          .eq('email', user.email)
          .eq('status', 'delivered')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setMarketReport(mrData ?? null);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  const hasNewListings = newListings.length > 0 || nearbyListings.length > 0;
  const hasMatchedBuyers = matchedBuyers.length > 0;

  return (
    <div className="bg-surface text-on-surface antialiased font-body">
      <Header />

      {showSubmittedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-2xl shadow-2xl">
          <span className="material-symbols-outlined text-emerald-300" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="font-bold text-sm">Listing submitted for review!</p>
            <p className="text-white/70 text-xs">You&apos;ll receive an email confirmation shortly.</p>
          </div>
          <button onClick={() => setShowSubmittedToast(false)} className="ml-2 text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <main className="max-w-4xl mx-auto pt-24 pb-16 px-4 sm:px-8">

        {/* SECTION 1 — GREETING */}
        <header className="mb-8">
          {loading ? (
            <div className="flex items-center gap-3">
              <span className="font-headline text-3xl sm:text-4xl font-extrabold text-primary tracking-tighter">{getGreeting()},</span>
              <Skeleton className="h-10 w-36" />
            </div>
          ) : (
            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary tracking-tighter leading-tight">
              {getGreeting()},{' '}
              <span className="text-emerald-600">{firstName ?? 'there'}</span>
            </h1>
          )}
        </header>

        {/* SECTION 2 — QUICK ACTIONS */}
        <section className="mb-10">
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl px-6 py-4 flex items-center justify-between transition-all"
          >
            Quick Actions
            <span>{quickActionsOpen ? '▲' : '▼'}</span>
          </button>
          {quickActionsOpen && (
            <div className="mt-2 flex flex-col gap-2">
              {QUICK_ACTIONS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="block w-full bg-white border border-green-700 text-green-700 font-semibold rounded-xl px-6 py-4 hover:bg-green-50 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3 — FOR YOU */}
        <section className="mb-16">
          <h2 className="font-headline font-bold text-on-surface text-xl sm:text-2xl mb-4">For You</h2>
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {unreadCount > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-on-surface">
                    You have {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
                  </p>
                  <a
                    href="/messaging"
                    className="flex-none bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-colors"
                  >
                    View Messages
                  </a>
                </div>
              )}
              {hasMatchedBuyers && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-on-surface">New buyers are looking in your area</p>
                  <a
                    href="/buyer-directory"
                    className="flex-none bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-colors"
                  >
                    View Buyers
                  </a>
                </div>
              )}
              {hasNewListings && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-on-surface">New properties in your area</p>
                  <a
                    href="/marketplace"
                    className="flex-none bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-colors"
                  >
                    View Listings
                  </a>
                </div>
              )}
              {hasAnalysisReady && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-on-surface">Your property report is ready</p>
                  <a
                    href="/property-analysis"
                    className="flex-none bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-colors"
                  >
                    View Report
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Upgrade Banner — standard tier only, dismissible */}
        {!loading && tier === 'standard' && !bannerDismissed && (
          <section className="mb-16">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 shadow-lg">
              <button
                onClick={() => setBannerDismissed(true)}
                className="absolute top-4 right-4 text-emerald-200/70 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-8">
                <span className="material-symbols-outlined text-4xl text-emerald-300 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <div className="flex-1">
                  <h3 className="text-white font-black text-lg tracking-tight mb-1">Unlock the Full Power of LotScout</h3>
                  <p className="text-emerald-100/80 text-sm leading-relaxed">Upgrade your plan to access financing partners, a dedicated account manager, early access to listings and buyers, and quarterly market reports.</p>
                </div>
                <a
                  href="/pricing"
                  className="shrink-0 bg-white text-emerald-800 font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4 — MARKET UPDATES (below the fold) */}
        <section className="mt-16 pt-8 border-t border-outline-variant/10">
          <h2 className="font-headline font-bold text-on-surface text-xl sm:text-2xl mb-6">Market Updates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left: Monthly Market Update */}
            <div>
              <h3 className="text-base font-semibold text-on-surface mb-3">Monthly Market Update</h3>
              <p className="text-sm text-on-surface/70 leading-relaxed mb-3">
                The US vacant land market continues to show strong demand in Sun Belt states with median prices up 4.2% year over year. Days on market have increased slightly in Q2 2026 as inventory normalizes. Western markets remain supply-constrained with premium pricing near transit corridors.
              </p>
              <p className="text-xs text-on-surface/40">Updated monthly by LotScout</p>
            </div>

            {/* Right: Local Market Update */}
            <div>
              <h3 className="text-base font-semibold text-on-surface mb-3">Local Market Update</h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-9 w-36 mt-2" />
                </div>
              ) : marketReport ? (
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-1">
                    {marketReport.county} County, {marketReport.state} — {marketReport.report_month}
                  </p>
                  <p className="text-sm text-on-surface/70 leading-relaxed mb-4">
                    Your county-level land market intelligence report is ready to view. Click below to access your full analysis.
                  </p>
                  <a
                    href={marketReport.report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-colors"
                  >
                    View Full Report
                  </a>
                </div>
              ) : (
                <div>
                  <a
                    href="/market-reports"
                    className="inline-block bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-800 transition-colors mb-3"
                  >
                    Get Local Market Updates
                  </a>
                  <p className="text-xs text-on-surface/40">Receive monthly county-level land market intelligence for $9/mo.</p>
                </div>
              )}
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-emerald-900/5 bg-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 max-w-[1440px] mx-auto">
          <div className="mb-6 md:mb-0">
            <span className="font-headline font-bold text-emerald-900 text-lg">LotScout</span>
            <p className="text-slate-500 text-sm mt-1">&copy; 2024 LotScout. The Digital Cartographer.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">Privacy Policy</a>
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">Terms of Service</a>
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">Support</a>
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">API Documentation</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
