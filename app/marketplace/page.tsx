'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';
import LockedFeature from '@/components/LockedFeature';
import ListingLimitBanner from '@/components/ListingLimitBanner';
import UpgradeModal from '@/components/UpgradeModal';
import BoostModal from '@/components/BoostModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { MapListing } from '@/components/MarketplaceMap';

// Dynamically import map (Leaflet is client-only, no SSR)
const MarketplaceMap = dynamic(() => import('@/components/MarketplaceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-container-low rounded-2xl">
      <span className="material-symbols-outlined text-4xl text-secondary animate-pulse">map</span>
    </div>
  ),
});

interface Listing {
  id: string;
  title: string;
  state: string | null;
  county: string | null;
  zip_code: string | null;
  lot_size_acres: number | null;
  asking_price: number | null;
  zoning: string | null;
  road_access: string | null;
  utilities: string[] | null;
  photos_urls: string[] | null;
  user_id: string | null;
  created_at: string;
  status: string;
  promoted?: boolean;
  boost_expires_at?: string | null;
  lat: number | null;
  lng: number | null;
}

function formatPrice(n: number | null): string {
  if (!n) return 'Price TBD';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function formatAcreage(acres: number | null): string {
  if (!acres) return 'Acreage TBD';
  return `${acres.toLocaleString()} Acres`;
}

function SellerContact({ userId }: { userId: string | null }) {
  if (!userId) return null;
  return (
    <div className="pt-3 mt-3 border-t border-surface-container">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Listed By</p>
      <Link href={`/sellers/${userId}`} className="text-sm font-bold text-primary mb-1 hover:underline block">View Seller Profile</Link>
    </div>
  );
}

function formatBudget(min: number | null, max: number | null): string {
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return 'Flexible';
}

interface BuyerRequest {
  id: string;
  user_id: string;
  status: string;
  target_regions: string[];
  budget_min: number | null;
  budget_max: number | null;
  min_acreage: number | null;
  max_acreage: number | null;
  use_case: string;
  zoning_preference: string[];
  timeline: string;
  additional_notes: string | null;
  contact_preference: string[];
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
}

export default function MarketplacePage() {
  const { tier, profile, loading, listingsThisPeriod, listingStatus } = usePermissions();
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [showBuyerFreeModal, setShowBuyerFreeModal] = useState(false);
  const [showContactUpgradeModal, setShowContactUpgradeModal] = useState(false);
  const [boostModal, setBoostModal] = useState<{ listingId: string; listingTitle: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'buyer-requests'>('properties');
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [buyerRequestsLoading, setBuyerRequestsLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [filterPropAcreage, setFilterPropAcreage] = useState('');
  const [filterPropZoning, setFilterPropZoning] = useState('');
  const [filterPropUtilities, setFilterPropUtilities] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [filterAcreage, setFilterAcreage] = useState('');
  const [filterZoning, setFilterZoning] = useState('');
  const [filterUseCase, setFilterUseCase] = useState('');
  const [filterTimeline, setFilterTimeline] = useState('');
  const router = useRouter();

  const canViewContact = !loading && (tier === 'priority' || tier === 'exclusive');
  const isFreeUser = !loading && !tier;
  const isPaidUser = !loading && !!tier;

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(({ listings: data }) => {
        const now = new Date();
        const sorted = ((data as Listing[]) ?? []).sort((a, b) => {
          const aPromoted = a.promoted && a.boost_expires_at && new Date(a.boost_expires_at) > now;
          const bPromoted = b.promoted && b.boost_expires_at && new Date(b.boost_expires_at) > now;
          if (aPromoted && !bPromoted) return -1;
          if (!aPromoted && bPromoted) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setListings(sorted);
        setListingsLoading(false);
      })
      .catch(() => setListingsLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'buyer-requests') return;
    setBuyerRequestsLoading(true);
    const supabase = createClient();
    supabase
      .from('buyer_requests')
      .select('*, profiles(first_name, last_name, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBuyerRequests((data as BuyerRequest[]) ?? []);
        setBuyerRequestsLoading(false);
      });
  }, [activeTab]);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          (l.state ?? '').toLowerCase().includes(q) ||
          (l.county ?? '').toLowerCase().includes(q) ||
          (l.zip_code ?? '').toLowerCase().includes(q) ||
          (l.title ?? '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      // Acreage filter
      if (filterPropAcreage) {
        const acres = l.lot_size_acres ?? 0;
        if (filterPropAcreage === 'under5' && acres >= 5) return false;
        if (filterPropAcreage === '5-25' && (acres < 5 || acres > 25)) return false;
        if (filterPropAcreage === '25-100' && (acres < 25 || acres > 100)) return false;
        if (filterPropAcreage === '100-500' && (acres < 100 || acres > 500)) return false;
        if (filterPropAcreage === '500+' && acres < 500) return false;
      }
      // Zoning filter
      if (filterPropZoning) {
        const zoning = (l.zoning ?? '').toLowerCase();
        if (!zoning.includes(filterPropZoning.toLowerCase())) return false;
      }
      // Utilities filter
      if (filterPropUtilities) {
        const utilities = (l.utilities ?? []).map((u: string) => u.toLowerCase());
        if (!utilities.some((u: string) => u.includes(filterPropUtilities.toLowerCase()))) return false;
      }
      return true;
    });
  }, [listings, searchQuery, filterPropAcreage, filterPropZoning, filterPropUtilities]);

  const mapListings = useMemo<MapListing[]>(() => {
    return filteredListings
      .map(l => {
        if (!l.lat || !l.lng) return null;
        return {
          id: l.id as unknown as number,
          title: l.title,
          location: [l.county, l.state].filter(Boolean).join(', '),
          acreage: formatAcreage(l.lot_size_acres),
          price: formatPrice(l.asking_price),
          lat: l.lat,
          lng: l.lng,
          promoted: l.promoted,
        } as MapListing;
      })
      .filter((x): x is MapListing => x !== null);
  }, [filteredListings]);

  const filteredBuyerRequests = useMemo(() => {
    return buyerRequests.filter(req => {
      if (buyerSearchQuery.trim()) {
        const q = buyerSearchQuery.toLowerCase();
        const regionsText = (req.target_regions ?? []).join(' ').toLowerCase();
        const useCaseText = (req.use_case ?? '').toLowerCase();
        if (!regionsText.includes(q) && !useCaseText.includes(q)) return false;
      }
      if (filterBudget) {
        const min = req.budget_min ?? 0;
        const max = req.budget_max ?? Infinity;
        if (filterBudget === 'under50k' && max >= 50000) return false;
        if (filterBudget === '50k-100k' && (min > 100000 || max < 50000)) return false;
        if (filterBudget === '100k-500k' && (min > 500000 || max < 100000)) return false;
        if (filterBudget === '500k-1m' && (min > 1000000 || max < 500000)) return false;
        if (filterBudget === '1m-5m' && (min > 5000000 || max < 1000000)) return false;
        if (filterBudget === '5m+' && max < 5000000) return false;
      }
      if (filterAcreage) {
        const minAc = req.min_acreage ?? 0;
        const maxAc = req.max_acreage ?? Infinity;
        if (filterAcreage === 'under5' && maxAc >= 5) return false;
        if (filterAcreage === '5-25' && (minAc > 25 || maxAc < 5)) return false;
        if (filterAcreage === '25-100' && (minAc > 100 || maxAc < 25)) return false;
        if (filterAcreage === '100-500' && (minAc > 500 || maxAc < 100)) return false;
        if (filterAcreage === '500+' && maxAc < 500) return false;
      }
      if (filterZoning) {
        const zones = (req.zoning_preference ?? []).map((z: string) => z.toLowerCase());
        if (!zones.some((z: string) => z.includes(filterZoning.toLowerCase()))) return false;
      }
      if (filterUseCase) {
        const uc = (req.use_case ?? '').toLowerCase();
        if (!uc.includes(filterUseCase.toLowerCase())) return false;
      }
      if (filterTimeline) {
        if ((req.timeline ?? '').toLowerCase() !== filterTimeline.toLowerCase()) return false;
      }
      return true;
    });
  }, [buyerRequests, buyerSearchQuery, filterBudget, filterAcreage, filterZoning, filterUseCase, filterTimeline]);

  function handleCreateListing() {
    if (loading) return;
    if (!profile || !tier) { setShowFreeModal(true); return; }
    if (listingStatus === 'blocked') { setShowBlockedModal(true); }
    else { router.push('/create-listing'); }
  }

  function handlePostBuyerRequest() {
    if (loading) return;
    if (!profile || !tier) { setShowBuyerFreeModal(true); return; }
    router.push('/create-buyer-request');
  }

  return (
    <div className="bg-surface text-on-surface">
      <Header />

      {boostModal && (
        <BoostModal
          listingId={boostModal.listingId}
          listingTitle={boostModal.listingTitle}
          tier={tier ?? 'standard'}
          onClose={() => setBoostModal(null)}
        />
      )}

      {showBlockedModal && (
        <UpgradeModal featureName="Unlimited Listings" requiredTier="priority" onDismiss={() => setShowBlockedModal(false)} />
      )}

      {showFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFreeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowFreeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Create a Listing</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Listing your property requires a paid LotScout account. Choose a plan to get started.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowFreeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {showBuyerFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBuyerFreeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowBuyerFreeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Find a Property</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Finding a property requires a paid LotScout account. Choose a plan to get started.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowBuyerFreeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {showContactUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowContactUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowContactUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Contact Sellers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Contacting sellers and making offers requires a paid LotScout account. Upgrade to get direct access to every deal.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowContactUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-20 min-h-screen">
        {/* Header */}
        <section className="px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-primary tracking-tighter leading-tight mb-2">
              Scout Your <span className="text-emerald-600">Next Deal</span>
            </h1>
            <p className="text-slate-500 font-body text-base leading-relaxed">
              Browse 2,400+ off-market listings throughout the U.S.
            </p>
          </div>
        </section>

        {/* Tab toggle + search bar */}
        <div className="px-6 md:px-10 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full">
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'properties'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('buyer-requests')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'buyer-requests'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Buyer Requests
            </button>
          </div>

          {activeTab === 'properties' && (
            <div className="relative flex-1 max-w-lg">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by zip code, city, county, or state..."
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── PROPERTIES TAB ── */}
        {activeTab === 'properties' && (
          <>
            {/* Filter bar */}
            <div className="px-6 md:px-10 flex flex-wrap items-center gap-3 py-3 border-y border-outline-variant/20 mb-0">
              <select
                value={filterPropAcreage}
                onChange={e => setFilterPropAcreage(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Acreage Range</option>
                <option value="under5">Under 5 acres</option>
                <option value="5-25">5–25 acres</option>
                <option value="25-100">25–100 acres</option>
                <option value="100-500">100–500 acres</option>
                <option value="500+">500+ acres</option>
              </select>
              <select
                value={filterPropZoning}
                onChange={e => setFilterPropZoning(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Zoning Type</option>
                <option value="ag">Agricultural</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="recreational">Recreational</option>
                <option value="timber">Timber</option>
              </select>
              <select
                value={filterPropUtilities}
                onChange={e => setFilterPropUtilities(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Utilities Access</option>
                <option value="electric">Electric</option>
                <option value="water well">Water Well</option>
                <option value="septic">Septic System</option>
                <option value="none">No Utilities</option>
              </select>
              {(filterPropAcreage || filterPropZoning || filterPropUtilities || searchQuery) && (
                <button
                  onClick={() => { setFilterPropAcreage(''); setFilterPropZoning(''); setFilterPropUtilities(''); setSearchQuery(''); }}
                  className="text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Clear filters
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort:</span>
                <select className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer">
                  <option>Newest First</option>
                  <option>Price: High to Low</option>
                  <option>Acreage: Largest</option>
                </select>
              </div>
            </div>

            {!loading && tier === 'standard' && listingsThisPeriod >= 2 && (
              <div className="px-6 md:px-10 mt-4">
                <ListingLimitBanner listingsUsed={listingsThisPeriod} tier="standard" />
              </div>
            )}

            {/* Split layout: listings (left) + map (right) */}
            <div className="flex flex-col lg:flex-row h-[calc(100vh-260px)] min-h-[500px]">
              {/* Listings panel */}
              <div className="lg:w-[52%] xl:w-[55%] overflow-y-auto px-6 md:px-10 py-6 flex-shrink-0">
                {listingsLoading ? (
                  <div className="col-span-full flex items-center justify-center py-20">
                    <span className="material-symbols-outlined text-5xl text-secondary animate-spin">progress_activity</span>
                  </div>
                ) : filteredListings.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-secondary">
                    <span className="material-symbols-outlined text-5xl mb-4 block">search_off</span>
                    <p className="font-headline text-xl font-bold text-primary mb-2">No listings found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredListings.map(listing => (
                      <div
                        key={listing.id}
                        className={`bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border transition-all cursor-pointer ${
                          selectedListing === (listing.id as unknown as number)
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-outline-variant/20 hover:shadow-md hover:border-primary/20'
                        }`}
                        onClick={() => setSelectedListing(listing.id as unknown as number)}
                      >
                        {/* Image */}
                        <div className="relative h-44 overflow-hidden bg-surface-container-low">
                          {listing.photos_urls && listing.photos_urls.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={listing.photos_urls[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-5xl text-secondary/30">landscape</span>
                            </div>
                          )}
                          {listing.promoted && (!listing.boost_expires_at || new Date(listing.boost_expires_at) > new Date()) && (
                            <span className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured
                            </span>
                          )}
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                            {formatAcreage(listing.lot_size_acres)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <p className="font-headline font-bold text-base text-primary leading-snug mb-1 line-clamp-2">{listing.title}</p>
                          <p className="text-xs text-secondary mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {[listing.county, listing.state].filter(Boolean).join(', ') || listing.zip_code || 'Location TBD'}
                          </p>

                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xl font-black text-emerald-700">{formatPrice(listing.asking_price)}</p>
                            {listing.zoning && (
                              <span className="bg-surface-container text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">{listing.zoning}</span>
                            )}
                          </div>

                          {/* Tags */}
                          {(listing.road_access || (listing.utilities && listing.utilities.length > 0)) && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {listing.road_access && (
                                <span className="bg-surface-container text-secondary text-[10px] font-semibold px-2 py-0.5 rounded-full">{listing.road_access}</span>
                              )}
                              {(listing.utilities ?? []).slice(0, 2).map((u: string) => (
                                <span key={u} className="bg-surface-container text-secondary text-[10px] font-semibold px-2 py-0.5 rounded-full">{u}</span>
                              ))}
                            </div>
                          )}

                          {/* Seller */}
                          {listing.user_id === profile?.id && (
                            <div className="pt-3 mt-3 border-t border-surface-container">
                              <button
                                onClick={(e) => { e.stopPropagation(); setBoostModal({ listingId: listing.id, listingTitle: listing.title }); }}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                              >
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                                Boost Listing
                              </button>
                            </div>
                          )}
                          {listing.user_id !== profile?.id && loading ? (
                            <div className="mt-3 pt-3 border-t border-surface-container space-y-2">
                              <div className="h-3 bg-surface-container-high animate-pulse rounded w-24" />
                              <div className="h-3 bg-surface-container-high animate-pulse rounded w-40" />
                            </div>
                          ) : listing.user_id !== profile?.id && canViewContact ? (
                            <SellerContact userId={listing.user_id} />
                          ) : listing.user_id !== profile?.id && isFreeUser ? (
                            <div className="pt-3 mt-3 border-t border-surface-container">
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowContactUpgradeModal(true); }}
                                className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
                              >
                                <span className="material-symbols-outlined text-base">lock</span>
                                Upgrade to Contact Seller
                              </button>
                            </div>
                          ) : listing.user_id !== profile?.id ? (
                            <LockedFeature requiredTier="priority" message="Upgrade to Priority to contact this seller" className="rounded-xl mt-3">
                              <SellerContact userId={listing.user_id} />
                            </LockedFeature>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>{/* end listings panel */}

              {/* Map panel — sticky */}
              <div className="hidden lg:block flex-1 sticky top-20 self-start" style={{ height: 'calc(100vh - 260px)', padding: '12px 16px 12px 0' }}>
                <MarketplaceMap
                  listings={mapListings}
                  selectedId={selectedListing}
                  onSelect={setSelectedListing}
                />
              </div>
            </div>{/* end split layout */}
          </>
        )}

        {/* ── BUYER REQUESTS TAB ── */}
        {activeTab === 'buyer-requests' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-slate-500 text-sm">Active buyers looking for land that matches your listings</p>
              </div>
              <button
                onClick={handlePostBuyerRequest}
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Find a Property
              </button>
            </div>

            {/* Search bar */}
            <div className="mb-4">
              <div className="relative max-w-xl">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
                <input
                  type="text"
                  value={buyerSearchQuery}
                  onChange={e => setBuyerSearchQuery(e.target.value)}
                  placeholder="Search by state, county, or zip code..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                {buyerSearchQuery && (
                  <button onClick={() => setBuyerSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 py-4 border-y border-outline-variant/20 mb-8">
              <select
                value={filterBudget}
                onChange={e => setFilterBudget(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Budget Range</option>
                <option value="under50k">Under $50K</option>
                <option value="50k-100k">$50K-$100K</option>
                <option value="100k-500k">$100K-$500K</option>
                <option value="500k-1m">$500K-$1M</option>
                <option value="1m-5m">$1M-$5M</option>
                <option value="5m+">$5M+</option>
              </select>
              <select
                value={filterAcreage}
                onChange={e => setFilterAcreage(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Acreage Range</option>
                <option value="under5">Under 5 acres</option>
                <option value="5-25">5-25 acres</option>
                <option value="25-100">25-100 acres</option>
                <option value="100-500">100-500 acres</option>
                <option value="500+">500+ acres</option>
              </select>
              <select
                value={filterZoning}
                onChange={e => setFilterZoning(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Zoning Type</option>
                <option value="agricultural">Agricultural</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="mixed use">Mixed Use</option>
                <option value="recreational">Recreational</option>
                <option value="timber">Timber</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterUseCase}
                onChange={e => setFilterUseCase(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Use Case</option>
                <option value="row crop">Row Crop</option>
                <option value="livestock">Livestock/Ranching</option>
                <option value="timber">Timber</option>
                <option value="recreational">Recreational</option>
                <option value="residential development">Residential Development</option>
                <option value="commercial development">Commercial Development</option>
                <option value="conservation">Conservation</option>
                <option value="investment">Investment</option>
              </select>
              <select
                value={filterTimeline}
                onChange={e => setFilterTimeline(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Timeline</option>
                <option value="Immediately">Immediately</option>
                <option value="1-3 months">1-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="6+ months">6+ months</option>
              </select>
              {(filterBudget || filterAcreage || filterZoning || filterUseCase || filterTimeline || buyerSearchQuery) && (
                <button
                  onClick={() => { setFilterBudget(''); setFilterAcreage(''); setFilterZoning(''); setFilterUseCase(''); setFilterTimeline(''); setBuyerSearchQuery(''); }}
                  className="text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Clear filters
                </button>
              )}
            </div>

            {buyerRequestsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface-container-low rounded-2xl p-6 animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-surface-container-high rounded w-24" />
                        <div className="h-2 bg-surface-container-high rounded w-16" />
                      </div>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded w-full" />
                    <div className="h-2 bg-surface-container-high rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : buyerRequests.length === 0 ? (
              <div className="text-center py-24 text-secondary">
                <span className="material-symbols-outlined text-6xl mb-4 block text-primary/20">person_search</span>
                <p className="font-headline text-2xl font-bold text-primary mb-2">No buyer requests yet</p>
                <p className="text-sm mb-6">Be the first to post your buying criteria and connect with sellers</p>
                <button onClick={handlePostBuyerRequest} className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  Find a Property
                </button>
              </div>
            ) : filteredBuyerRequests.length === 0 ? (
              <div className="text-center py-16 text-secondary">
                <span className="material-symbols-outlined text-5xl mb-4 block text-primary/20">filter_list_off</span>
                <p className="font-headline text-xl font-bold text-primary mb-2">No results match your filters</p>
                <p className="text-sm">Try adjusting your search or clearing filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuyerRequests.map(req => {
                  const firstName = req.profiles?.first_name ?? '';
                  const lastName = req.profiles?.last_name ?? '';
                  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Anonymous Buyer';
                  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'AB';
                  const blurIdentity = !loading && !canViewContact;

                  return (
                    <div key={req.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                      {/* Header: avatar + name + badge */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${blurIdentity ? 'blur-sm' : ''}`}>
                            {req.profiles?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={req.profiles.avatar_url} alt="Buyer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">{initials}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`font-bold text-primary text-sm ${blurIdentity ? 'blur-sm select-none' : ''}`}>{displayName}</p>
                            <p className="text-[10px] text-secondary uppercase tracking-widest font-bold">Verified Buyer</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Active Buying
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2.5 text-sm">
                        {req.target_regions?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-secondary text-base mt-0.5">location_on</span>
                            <span className="text-on-surface-variant">{req.target_regions.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-base">payments</span>
                          <span className="text-on-surface-variant">{formatBudget(req.budget_min, req.budget_max)}</span>
                        </div>
                        {req.min_acreage && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-base">landscape</span>
                            <span className="text-on-surface-variant">
                              {req.min_acreage}{req.max_acreage ? ` - ${req.max_acreage}` : '+'} acres
                            </span>
                          </div>
                        )}
                        {req.use_case && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-base">agriculture</span>
                            <span className="bg-primary/8 text-primary px-2 py-0.5 rounded-full text-xs font-bold capitalize">{req.use_case}</span>
                          </div>
                        )}
                        {req.timeline && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-base">schedule</span>
                            <span className="text-on-surface-variant text-xs">{req.timeline}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 mt-auto border-t border-outline-variant/20 flex flex-col gap-2">
                        <Link
                          href={`/buyer-requests/${req.id}`}
                          className="w-full flex items-center justify-center gap-2 border border-outline-variant/40 text-secondary py-2 rounded-xl font-semibold text-xs hover:bg-surface-container-low transition-colors"
                        >
                          View Buying Criteria
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                        {canViewContact ? (
                          <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                            <span className="material-symbols-outlined text-base">mail</span>
                            Contact Buyer
                          </button>
                        ) : isFreeUser ? (
                          <button
                            onClick={() => setShowContactUpgradeModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">lock</span>
                            Upgrade to Contact Buyer
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push('/pricing')}
                            className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-secondary py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">lock</span>
                            Upgrade to Contact
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="w-full py-16 px-8 bg-primary dark:bg-black grid grid-cols-1 md:grid-cols-2 items-center gap-8 z-10 relative">
        <div className="space-y-6">
          <div className="text-emerald-50 font-black text-2xl tracking-tighter flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="LotScout Logo" className="h-10 w-10 object-contain invert brightness-0" src="/logo.png" />
            LotScout
          </div>
          <p className="font-['Inter'] text-xs tracking-wide uppercase text-emerald-200/60 max-w-sm leading-relaxed">
            Advanced Geospatial Land Management Systems. Precision in every boundary. Engineered for the modern acquisition professional.
          </p>
          <div className="text-emerald-200/40 font-['Inter'] text-[10px] uppercase tracking-widest">© 2024 LotScout. All rights reserved.</div>
        </div>
        <div className="flex flex-wrap md:justify-end gap-x-10 gap-y-4 font-['Inter'] text-xs tracking-widest uppercase font-bold">
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Terms of Service</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Privacy Policy</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Data Sources</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Contact Support</a>
        </div>
      </footer>

      {/* FAB */}
      <div className="fixed bottom-10 right-10 z-[60]">
        <button
          onClick={activeTab === 'properties' ? handleCreateListing : handlePostBuyerRequest}
          className="bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform ring-4 ring-white/10"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        </button>
      </div>
    </div>
  );
}
