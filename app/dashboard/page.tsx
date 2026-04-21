'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import LockedFeature from '@/components/LockedFeature';
import CreateListingGate from '@/components/CreateListingGate';
import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/lib/permissions';

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
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

interface Message {
  id: any;
  body: any;
  created_at: any;
  listing_id: any;
  sender: any;
  listing: any;
}

interface UserListing {
  id: any;
  address: any;
  acreage: any;
  price: any;
  status: any;
  county?: any;
  land_type?: any;
}

interface FeedListing {
  id: any;
  title: any;
  location: any;
  county: any;
  acreage: any;
  price: any;
  land_type: any;
  created_at: any;
}


interface Report {
  id: any;
  created_at: any;
  address: any;
  score: any;
  status: any;
  title?: any;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-xl ${className ?? ''}`} />;
}

function senderName(msg: Message): string {
  if (!msg.sender) return 'Unknown';
  const { first_name, last_name } = msg.sender;
  return [first_name, last_name].filter(Boolean).join(' ') || 'Unknown';
}

function buyerName(b: any): string {
  if (!b.buyer) return 'Anonymous Buyer';
  const { first_name, last_name } = b.buyer;
  return [first_name, last_name].filter(Boolean).join(' ') || 'Anonymous Buyer';
}

function criteriaLabel(b: any): string {
  const parts: string[] = [];
  if (b.land_type) parts.push(b.land_type.charAt(0).toUpperCase() + b.land_type.slice(1));
  if (b.min_acreage != null || b.max_acreage != null) {
    const lo = b.min_acreage != null ? `${b.min_acreage}` : '0';
    const hi = b.max_acreage != null ? `${b.max_acreage}` : '+';
    parts.push(`${lo}–${hi} Acres`);
  }
  if (b.location) parts.push(b.location);
  return parts.join(' • ') || 'Open criteria';
}

export default function DashboardPage() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [profileTodos, setProfileTodos] = useState<{ label: string; href: string }[]>([]);
  const [profileComplete, setProfileComplete] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchedBuyers, setMatchedBuyers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [newListings, setNewListings] = useState<FeedListing[]>([]);
  const [hasBuyerCriteria, setHasBuyerCriteria] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showSubmittedToast, setShowSubmittedToast] = useState(false);

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

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [profileRes, subRes, messagesRes, reportsRes, userListingsRes, userCriteriaRes] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name, avatar_url, bio, phone, company_name').eq('id', user.id).single(),
        supabase.from('subscriptions').select('tier').eq('user_id', user.id).eq('status', 'active').single(),
        supabase.from('messages')
          .select('id, body, created_at, listing_id, sender:sender_id(first_name, last_name), listing:listing_id(title)')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('reports')
          .select('id, title, score, created_at')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false }),
        supabase.from('listings')
          .select('id, acreage, price, county, land_type')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase.from('buyer_criteria')
          .select('id, location, min_acreage, max_acreage, min_budget, max_budget, land_type')
          .eq('user_id', user.id)
          .eq('active', true),
      ]);

      setFirstName(
        profileRes.data?.first_name ??
        (user.user_metadata?.first_name as string | undefined) ??
        null
      );
      setTier((subRes?.data?.tier as Tier) ?? null);

      // Profile completeness checklist
      const p = profileRes.data;
      const todos: { label: string; href: string }[] = [];
      if (!p?.avatar_url) todos.push({ label: 'Add a profile photo', href: '/edit-profile' });
      if (!p?.bio) todos.push({ label: 'Write an about/bio section', href: '/edit-profile' });
      if (!p?.phone) todos.push({ label: 'Add your phone number', href: '/edit-profile' });
      if (!p?.company_name) todos.push({ label: 'Add your company name', href: '/edit-profile' });
      setProfileTodos(todos);
      setProfileComplete(todos.length === 0);
      setMessages((messagesRes.data as any[]) ?? []);
      setReports((reportsRes.data as any[]) ?? []);

      const userListings: any[] = (userListingsRes.data as any[]) ?? [];
      const userCriteria: any[] = (userCriteriaRes.data as any[]) ?? [];
      setHasBuyerCriteria(userCriteria.length > 0);

      // Matched buyers: find other users' active criteria that match user's listings
      if (userListings.length > 0) {
        const { data: allCriteria } = await supabase
          .from('buyer_criteria')
          .select('id, user_id, location, min_acreage, max_acreage, min_budget, max_budget, land_type, buyer:user_id(first_name, last_name)')
          .eq('active', true)
          .neq('user_id', user.id);

        if (allCriteria) {
          const scored = (allCriteria as any[])
            .filter(criteria => userListings.some(l => listingMatchesCriteria(l, criteria)))
            .map(criteria => ({
              criteria,
              score: matchScore(userListings.find(l => listingMatchesCriteria(l, criteria))!, criteria),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
          setMatchedBuyers(scored);
        }
      }

      // New listings for user: fetch listings from others matching user's criteria
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

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="bg-surface text-on-surface antialiased font-body">
      <Header />

      {showSubmittedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-2xl shadow-2xl">
          <span className="material-symbols-outlined text-emerald-300" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="font-bold text-sm">Listing submitted for review!</p>
            <p className="text-white/70 text-xs">You'll receive an email confirmation shortly.</p>
          </div>
          <button onClick={() => setShowSubmittedToast(false)} className="ml-2 text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto pt-24 pb-12 px-8">

        {/* Dashboard Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <p className="text-secondary font-medium tracking-wide uppercase text-xs mb-1">Overview</p>
            {loading ? (
              <div className="flex items-center gap-3">
                <span className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter">{getGreeting()},</span>
                <Skeleton className="h-12 w-40 rounded-2xl" />
              </div>
            ) : (
              <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight">
                {getGreeting()},{' '}
                <span className="text-emerald-600">{firstName ?? 'there'}</span>
              </h1>
            )}
          </div>
          <div className="text-right">
            <p className="text-secondary font-semibold font-body">{today}</p>
            <p className="text-on-surface-variant text-sm">Central Texas Market • Open</p>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-3 mb-12">
          {[
            { icon: 'analytics', label: 'Analyze a Property', href: '/property-analysis' },
            { icon: 'explore',   label: 'Browse Marketplace', href: '/marketplace'        },
            { icon: 'groups',    label: 'Find Buyers',        href: '/buyer-directory'    },
          ].map(({ icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-lowest shadow-sm hover:shadow-md transition-all group border border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-primary">{icon}</span>
              <span className="text-sm font-semibold text-primary">{label}</span>
            </a>
          ))}
          <CreateListingGate className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-lowest shadow-sm hover:shadow-md transition-all group border border-outline-variant/10">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            <span className="text-sm font-semibold text-primary">Create Listing</span>
          </CreateListingGate>
        </section>

        {/* Profile Completeness */}
        {!loading && (
          profileComplete ? (
            <section className="flex items-center gap-3 mb-8 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl w-fit">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm font-semibold text-emerald-800">Profile complete — great work!</span>
            </section>
          ) : (
            <section className="mb-10 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
                <h2 className="font-headline font-bold text-primary text-lg">Complete your profile</h2>
                <span className="ml-auto text-xs font-bold text-secondary">{4 - profileTodos.length}/4 done</span>
              </div>
              <ul className="space-y-2">
                {profileTodos.map(todo => (
                  <li key={todo.label}>
                    <a
                      href={todo.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors group"
                    >
                      <span className="w-5 h-5 rounded-full border-2 border-outline-variant group-hover:border-primary transition-colors shrink-0" />
                      <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{todo.label}</span>
                      <span className="material-symbols-outlined text-secondary group-hover:text-primary ml-auto text-base transition-colors">arrow_forward</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        )}

        {/* Action Required: Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

          {/* New Messages */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-primary px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold tracking-tight text-lg">
                New Messages{!loading && messages.length > 0 && ` (${messages.length})`}
              </h3>
              <span className="material-symbols-outlined text-white/70">mail</span>
            </div>
            <div className="divide-y divide-surface-container">
              {loading ? (
                [0, 1, 2].map(i => (
                  <div key={i} className="p-6 flex items-start gap-4">
                    <Skeleton className="w-12 h-12 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : messages.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">mail</span>
                  <p className="text-secondary text-sm">No new messages</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="p-6 flex items-start gap-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-on-surface">{senderName(msg)}</h4>
                        <span className="text-xs text-on-surface-variant shrink-0 ml-2">{relativeTime(msg.created_at)}</span>
                      </div>
                      {msg.listing && (
                        <div className="flex gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider truncate max-w-[160px]">
                            {msg.listing.title}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-secondary line-clamp-1">{msg.body}</p>
                    </div>
                    <a href="/messaging" className="self-center opacity-0 group-hover:opacity-100 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0">Reply</a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Matched Buyers */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col border border-outline-variant/10">
            <div className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/5">
              <h3 className="text-primary font-bold tracking-tight text-lg">
                Matched Buyers{!loading && matchedBuyers.length > 0 && ` (${matchedBuyers.length})`}
              </h3>
              <span className="material-symbols-outlined text-primary">hub</span>
            </div>
            <div className="p-6 space-y-6 flex-1">
              {loading ? (
                [0, 1].map(i => (
                  <div key={i} className="flex items-center gap-6">
                    <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                ))
              ) : matchedBuyers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">hub</span>
                  <p className="text-secondary text-sm">No matched buyers yet.<br />Add an active listing to start matching.</p>
                </div>
              ) : (
                matchedBuyers.map(({ criteria, score }) => (
                  <div key={criteria.id} className="relative group">
                    <div className="absolute -inset-2 rounded-2xl bg-surface-container-low scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200" />
                    <div className="relative flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full border-[3px] border-primary-fixed-dim p-1 shrink-0">
                        <div className="w-full h-full bg-primary flex items-center justify-center rounded-full text-white font-bold text-xl">{score}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {!loading && tier === 'standard' ? (
                          <LockedFeature
                            requiredTier="priority"
                            message="Upgrade to Priority to view buyer contact details"
                            className="rounded-xl mb-2"
                          >
                            <div className="p-1">
                              <h4 className="font-bold text-on-surface text-lg truncate">{buyerName(criteria)}</h4>
                              <p className="text-sm text-secondary truncate">Seeking: {criteriaLabel(criteria)}</p>
                            </div>
                          </LockedFeature>
                        ) : (
                          <>
                            <h4 className="font-bold text-on-surface text-lg truncate">{buyerName(criteria)}</h4>
                            <p className="text-sm text-secondary mb-2 truncate">Seeking: {criteriaLabel(criteria)}</p>
                          </>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {criteria.max_budget && (
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase">
                              Up to {formatPrice(criteria.max_budget)}
                            </span>
                          )}
                        </div>
                      </div>
                      <a href="/buyer-directory" className="bg-surface-container-high text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all shrink-0">View Profile</a>
                    </div>
                  </div>
                ))
              )}
            </div>
            {!loading && (
              <div className="px-6 py-4 bg-surface-container-low/50">
                <p className="text-xs text-secondary italic">
                  {matchedBuyers.length > 0
                    ? `${matchedBuyers.length} buyer${matchedBuyers.length > 1 ? 's' : ''} matched to your active listings.`
                    : 'Matches update automatically when new buyers register criteria.'}
                </p>
              </div>
            )}
          </div>

        </section>

        {/* Secondary Row */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">

          {/* Completed Reports */}
          <div className="xl:col-span-5 bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
            <h3 className="text-primary font-bold tracking-tight text-xl mb-6 font-headline">Completed Reports</h3>
            <div className="space-y-4">
              {loading ? (
                [0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">analytics</span>
                  <p className="text-secondary text-sm">No completed reports in the last 7 days.</p>
                </div>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full border-4 border-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-lg">{report.score ?? '—'}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{report.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-secondary">Analyzed: {relativeTime(report.created_at)}</p>
                          {!loading && tier && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${tier === 'standard' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {tier === 'standard' ? '24hr delivery' : '15min delivery'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <a href="/property-analysis" className="flex items-center gap-1 text-primary font-bold text-sm hover:underline shrink-0">
                      View Report
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Listings For You */}
          {(loading || hasBuyerCriteria) && (
            <div className="xl:col-span-7">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-primary font-bold tracking-tight text-xl font-headline">New Listings For You</h3>
                <a className="text-secondary font-semibold text-sm hover:text-primary transition-colors" href="/marketplace">See all matches</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  [0, 1].map(i => (
                    <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
                      <Skeleton className="h-48 rounded-none" />
                      <div className="p-5 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : newListings.length === 0 ? (
                  <div className="md:col-span-2 flex flex-col items-center justify-center text-center gap-3 py-12 bg-surface-container-lowest rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">explore</span>
                    <p className="text-secondary text-sm">No matching listings right now.<br />Check back soon or <a href="/marketplace" className="text-primary font-semibold hover:underline">browse the marketplace</a>.</p>
                  </div>
                ) : (
                  newListings.map(listing => (
                    <div key={listing.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                      <div className="relative h-48 overflow-hidden bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">landscape</span>
                        {listing.price && (
                          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-primary font-bold text-sm">
                            {formatPrice(listing.price)}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-on-surface mb-1">{listing.title}</h4>
                        <p className="text-xs text-secondary mb-4">{listing.location ?? listing.county ?? 'Location TBD'}</p>
                        <div className="flex gap-2 flex-wrap">
                          {listing.acreage != null && (
                            <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-2 py-1 rounded-md text-[10px] font-bold uppercase">{listing.acreage} Acres</span>
                          )}
                          {listing.land_type && (
                            <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-2 py-1 rounded-md text-[10px] font-bold uppercase">{listing.land_type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </section>

        {/* Upgrade Banner — standard tier only, dismissible */}
        {!loading && tier === 'standard' && !bannerDismissed && (
          <section className="mb-12">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 to-emerald-600 p-8 shadow-lg">
              <button
                onClick={() => setBannerDismissed(true)}
                className="absolute top-4 right-4 text-emerald-200/70 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <span className="material-symbols-outlined text-4xl text-emerald-300 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-xl tracking-tight mb-1">Unlock the Full Power of LotScout</h3>
                  <p className="text-emerald-100/80 text-sm leading-relaxed">Upgrade your plan to access financing partners, a dedicated account manager, early access to listings and buyers, and quarterly market reports.</p>
                </div>
                <a
                  href="/pricing"
                  className="shrink-0 bg-white text-emerald-800 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  View Pricing Plans
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Weekly Market Update */}
        <section className="bg-primary rounded-[2rem] p-10 relative overflow-hidden text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="w-full h-full bg-gradient-to-l from-emerald-400 to-transparent" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-emerald-500/30">Live Update</span>
                <span className="text-emerald-100/60 text-xs font-medium italic">May 10 – May 17, 2024</span>
              </div>
              <h2 className="text-5xl font-extrabold tracking-tighter mb-6 leading-none font-headline">The Digital Cartographer Weekly</h2>
              <p className="text-emerald-100/70 text-lg font-body max-w-xl mb-8 leading-relaxed">
                Central Texas land value continues to surge, showing a 4.2% increase in industrial-zoned parcels. Discover how current infrastructure projects are shifting the buyer landscape.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: 'Austin MSA', value: '+5.2%' },
                  { label: 'San Marcos', value: '+3.8%' },
                  { label: 'Kyle/Buda',  value: '+6.1%' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">{label}</span>
                    <span className="text-xl font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                <h4 className="text-emerald-300 font-bold uppercase tracking-widest text-xs mb-6">Land Type Spotlight</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Light Industrial', icon: 'trending_up',   iconColor: 'text-emerald-400' },
                    { label: 'Multi-Family',      icon: 'trending_up',   iconColor: 'text-emerald-400' },
                    { label: 'Agricultural',      icon: 'trending_flat', iconColor: 'text-white/40'    },
                  ].map(({ label, icon, iconColor }) => (
                    <div key={label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                      <span className="font-bold">{label}</span>
                      <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 text-primary font-extrabold py-4 rounded-2xl transition-all">
                  Read Full Market Analysis
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-emerald-900/5 bg-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-[1440px] mx-auto">
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
