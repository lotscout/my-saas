'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';

const ListingsMap = dynamic(() => import('@/components/ListingsMap'), { ssr: false, loading: () => <div className="w-full rounded-2xl bg-surface-container-low animate-pulse" style={{height:'600px'}} /> });
import Link from 'next/link';
import Header from '@/components/Header';
import LockedFeature from '@/components/LockedFeature';
import ListingLimitBanner from '@/components/ListingLimitBanner';
import UpgradeModal from '@/components/UpgradeModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BoostModal from '@/components/BoostModal';

const STATE_NAMES: Record<string, string> = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS',
  'kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA',
  'michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT',
  'nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM',
  'new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK',
  'oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC',
  'south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT',
  'virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY',
};

interface Listing {
  id: string;
  title: string | null;
  property_description: string | null;
  state: string | null;
  county: string | null;
  zip_code: string | null;
  street_address: string | null;
  lot_size_acres: number | null;
  lot_size_sqft: number | null;
  zoning: string | null;
  road_access: string[];
  utilities: string[];
  asking_price: number | null;
  price_negotiable: boolean;
  ownership_type: string | null;
  contact_methods: string[];
  status: string;
  photos_urls: string[] | null;
  digital_signature: string | null;
  created_at: string;
  user_id?: string | null;
  promoted?: boolean;
  boost_expires_at?: string | null;
  lat?: number | null;
  lng?: number | null;
}

function formatPrice(n: number | null): string {
  if (!n) return 'Price on Request';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}

function formatAcreage(acres: number | null, sqft: number | null): string {
  if (acres) return `${acres.toLocaleString()} Acres`;
  if (sqft) return `${sqft.toLocaleString()} Sq Ft`;
  return '';
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80';

const _LISTINGS_LEGACY = [
  {
    id: 1,
    title: 'Elderwood Peak Estates',
    location: 'Aspen Ridge, CO',
    acreage: '420.5 Acres',
    price: '$4.25M',
    promoted: true,
    badge: { label: 'Residential-A1', position: 'top-right' },
    tags: ['R-1 Agricultural', 'Well, Solar-Ready'],
    seller: { name: 'Hargrove Land Co.', email: 'deals@hargrove.com', phone: '+1 (970) 555-0142' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxJzpl7PtPZ3P9-BbZWEnnurDCh6iCuzDzxd8ZqqT8JD-uoS6-tQYgI_5g7BnCOd1fs3CLCNTBes6QTw5XNx3DYg00cXSRnCDOV-ZtJM9W4SpVL9aDpq3c-K3x7DHVcOaQzcGxY23ECyKHXOCa9XhyhCMPPI_X5zQB49vCbRWK9mw81BYCTcpT41Tixw8YTyPaCHGElLbCoI2F7Ibp7h4rhUYZ6t3kCUX6-hXPN0VSjjTo3gKOFBoTlscbAUd9I2zokdmW_oU__CKd',
    imgAlt: 'Aerial mountain vista',
  },
  {
    id: 2,
    title: 'Sutter Basin Flats',
    location: 'Sacramento Valley, CA',
    acreage: '64 Acres',
    price: '$890k',
    promoted: false,
    badge: { label: 'Utility Ready', position: 'bottom-left' },
    tags: ['Prime Soil', 'Water Rights'],
    seller: { name: 'Basin Properties LLC', email: 'info@basinprops.com', phone: '+1 (916) 555-0278' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4r8Hu0cQUcXuWX0WzV_2H0XqwnqPBMB2Fca9iPIFQXepEoRpS7nvtdqueP7eKmXCCpLpVbOoMXZAw0y3EUYLrYQgzam2dLiwITqadNzN_VqADUyY5_rZZ0nrwHcQbWCNUvqozu5VPXXJNMSu8bQxKsOkaWrpOetGX4J5YePqJyv013HCe5gyz6sakET7TkLMvrdeX5S4KHoiMziudlXEMOWm3WOKmrg1cYfTmrwfG2a1YP7q8n8g9nQDOWoR2j6yETU4PFUd46Ylq',
    imgAlt: 'Verdant plains',
  },
  {
    id: 3,
    title: 'Crystal Lake Ridge',
    location: 'Boundary Waters, MN',
    acreage: '12 Acres',
    price: '$1.2M',
    promoted: false,
    badge: null,
    tags: ['Lakefront', 'Dense Timber'],
    seller: { name: 'Northwoods Realty', email: 'listings@northwoodsrealty.com', phone: '+1 (218) 555-0391' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJgD76eTifmmVKsF6SKPMw5sl_2i-NBS2SYmw1MVN0Ek0JNspDy1hmu6WwFi8BiXHSoUOnbdytJbBTi0ya5yYZqKnvCL27J0iSnXUF8qfFBhhVmTnlDLP51Ku3X96FjFoIJEqp82xY17mK3iUAwH2LXk81xF0UeDp8DxsuxCfj3oteXz-N4RWMsBlIVJpW9--ORcBEbgHDAxRpbizysUp_31kt2qNwAw7MDa_i3YxraxgJg_rEPvjFB213dKRX7dVCWWZloPV2zZN4',
    imgAlt: 'Alpine lake',
  },
  {
    id: 4,
    title: 'Red Rock Plateau',
    location: 'Sedona Outskirts, AZ',
    acreage: '120 Acres',
    price: '$340k',
    promoted: false,
    badge: null,
    tags: ['Zoned Commercial'],
    seller: { name: 'Desert Land Group', email: 'contact@desertland.com', phone: '+1 (928) 555-0456' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyf9G08S4V2FIgyV6ti9nSFXGqTOVLsmyHIQnc3htRd4FnzJmkfw70GUKVvqpYTKRed0tJGRZTCxscIC_rkhYQ8l5yxEWkB102mkOdmtcWGnuE9wFMgg13nv295YGLVkBmy6dQU6fWAiD0IoW_rqPWn3DsAzUoSa95_yff57-MtbAzpPEkFrTj-cuYDfKp0H5ivVubg-U5S-O-KVkdO4bsAy3jVR7b6mZdwUlpA4Wy4u7_D8aJn0ZBdwNMuRofdiRpMou6scDkdPQa',
    imgAlt: 'Desert mesa',
  },
  {
    id: 5,
    title: 'Old Growth Sanctuary',
    location: 'Olympic Peninsula, WA',
    acreage: '215 Acres',
    price: '$2.8M',
    promoted: false,
    badge: null,
    tags: ['Conservation Easement'],
    seller: { name: 'Pacific Timberland Trust', email: 'info@pttrust.org', phone: '+1 (360) 555-0512' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD-JzenLAuzwTyCM7r1lUolp3DE8j14_kDPQUYsrUPhcEihB-rfJUzfxvEavG__Ewz8h2zZlExQPGau_aYWRABPj_AvykNIraOyfsnuO2pYdvvd3azQ2I1RkjyxKsfeMdUlkHqB62r_8IwqxiVIc904u82VsxkrNMO7givq8WAaGULWDIGDsNEjlHvaQS8Clev7pxsv-9yRMgffR6A9d5mzxx6EXhPoDiHH9upjQVbaVWpQPoUkHpfWk4b437Jr1UPSANF7oeRayxn',
    imgAlt: 'Foggy forest',
  },
];

function SellerContact({ name, listingId }: { name: string | null; listingId: string }) {
  return (
    <div className="pt-3 mt-3 border-t border-surface-container">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Listed By</p>
      <p className="text-sm font-bold text-primary mb-2">{name || 'Private Seller'}</p>
      <Link
        href={`/listings/${listingId}`}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-xl font-bold text-xs hover:bg-primary/90 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">forum</span>
        Contact via LotScout
      </Link>
    </div>
  );
}

function formatBudget(min: number | null, max: number | null): string {
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
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
  const [activeTab, setActiveTab] = useState<'properties' | 'buyer-requests'>('properties');
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsSort, setListingsSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid'|'map'>('grid');
  const [mapListings, setMapListings] = useState<unknown[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [buyerRequestsLoading, setBuyerRequestsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [filterAcreage, setFilterAcreage] = useState('');
  const [filterZoning, setFilterZoning] = useState('');
  const [filterUtilities, setFilterUtilities] = useState('');
  const [filterUseCase, setFilterUseCase] = useState('');
  const [filterTimeline, setFilterTimeline] = useState('');
  const [filterLotSizeUnit, setFilterLotSizeUnit] = useState<'acres' | 'sqft'>('acres');
  const [filterLotSizeAcres, setFilterLotSizeAcres] = useState('');
  const [filterSqFtMin, setFilterSqFtMin] = useState('');
  const [filterSqFtMax, setFilterSqFtMax] = useState('');
  const [filterRoadAccessProps, setFilterRoadAccessProps] = useState('');
  const [filterRoadAccessBR, setFilterRoadAccessBR] = useState('');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [boostModal, setBoostModal] = useState<{ listingId: string; title: string } | null>(null);
  const router = useRouter();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-filter-dropdown]')) setOpenFilter(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const canViewContact = !loading && (tier === 'priority' || tier === 'exclusive');
  const isFreeUser = !loading && !tier;
  const isPaidUser = !loading && !!tier;

  useEffect(() => {
    if (viewMode !== 'map' || mapListings.length > 0) return;
    setMapLoading(true);
    fetch('/api/listings/map')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMapListings(data); setMapLoading(false); })
      .catch(() => setMapLoading(false));
  }, [viewMode, mapListings.length]);

  useEffect(() => {
    setListingsLoading(true);
    const params = new URLSearchParams({ sort: listingsSort, limit: '200' });
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const now = new Date();
          const sorted = [...(data as Listing[])].sort((a, b) => {
            const aActive = !!(a.promoted && a.boost_expires_at && new Date(a.boost_expires_at) > now);
            const bActive = !!(b.promoted && b.boost_expires_at && new Date(b.boost_expires_at) > now);
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            return 0;
          });
          setListings(sorted);
        } else if (data && typeof data === 'object' && 'error' in data) {
          console.error('[marketplace] listings API error:', (data as any).error);
          setListings([]);
        }
        setListingsLoading(false);
      })
      .catch(() => setListingsLoading(false));
  }, [listingsSort]);

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
    let result = listings;

    // Search — resolves full state names to abbreviations
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const stateAbbrev = STATE_NAMES[q] ??
        STATE_NAMES[Object.keys(STATE_NAMES).find(k => k.startsWith(q)) ?? ''] ?? '';
      result = result.filter(l =>
        (l.title ?? '').toLowerCase().includes(q) ||
        (l.state ?? '').toLowerCase() === q ||
        (stateAbbrev && (l.state ?? '').toUpperCase() === stateAbbrev.toUpperCase()) ||
        (l.county ?? '').toLowerCase().includes(q) ||
        (l.zip_code ?? '').includes(q)
      );
    }

    // Lot size filter
    if (filterLotSizeUnit === 'acres' && filterLotSizeAcres) {
      result = result.filter(l => {
        const acres = l.lot_size_acres ?? (l.lot_size_sqft ? l.lot_size_sqft / 43560 : null);
        if (acres === null) return true;
        if (filterLotSizeAcres === 'under1') return acres < 1;
        if (filterLotSizeAcres === '1-5') return acres >= 1 && acres < 5;
        if (filterLotSizeAcres === '5-25') return acres >= 5 && acres <= 25;
        if (filterLotSizeAcres === '25-100') return acres > 25 && acres <= 100;
        if (filterLotSizeAcres === '100-500') return acres > 100 && acres <= 500;
        if (filterLotSizeAcres === '500+') return acres > 500;
        return true;
      });
    } else if (filterLotSizeUnit === 'sqft' && (filterSqFtMin || filterSqFtMax)) {
      const minSqft = filterSqFtMin ? Number(filterSqFtMin) : null;
      const maxSqft = filterSqFtMax ? Number(filterSqFtMax) : null;
      result = result.filter(l => {
        const sqft = l.lot_size_sqft ?? (l.lot_size_acres ? Math.round(l.lot_size_acres * 43560) : null);
        if (sqft === null) return true;
        if (minSqft && sqft < minSqft) return false;
        if (maxSqft && sqft > maxSqft) return false;
        return true;
      });
    }

    // Road access filter
    if (filterRoadAccessProps) {
      result = result.filter(l =>
        (l.road_access ?? []).some((r: string) => r.toLowerCase().includes(filterRoadAccessProps.toLowerCase()))
      );
    }

    // Zoning filter
    if (filterZoning) {
      result = result.filter(l => {
        const z = (l.zoning ?? '').toLowerCase();
        if (filterZoning === 'agricultural') return /ag|a-1|a-d|ae-|a_1|agricultural/.test(z);
        if (filterZoning === 'recreational') return z.includes('rec');
        if (filterZoning === 'residential') return z.includes('res') || z === 'rr' || /rr-/.test(z);
        if (filterZoning === 'commercial') return z.includes('com');
        if (filterZoning === 'mixed') return z.includes('mix');
        if (filterZoning === 'unrestricted') return z.includes('unrest') || z === 'any';
        return z.includes(filterZoning.toLowerCase());
      });
    }

    // Utilities filter
    if (filterUtilities) {
      result = result.filter(l => {
        const utils = (l.utilities ?? []).map((u: string) => u.toLowerCase());
        return utils.some((u: string) => u.includes(filterUtilities.toLowerCase()));
      });
    }

    return result;
  }, [listings, searchQuery, filterLotSizeUnit, filterLotSizeAcres, filterSqFtMin, filterSqFtMax, filterRoadAccessProps, filterZoning, filterUtilities]);

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
      if (filterRoadAccessBR) {
        const roads = ((req as unknown as Record<string, unknown>).road_access ?? []) as string[];
        if (!roads.some((r: string) => r.toLowerCase().includes(filterRoadAccessBR.toLowerCase()))) return false;
      }
      return true;
    });
  }, [buyerRequests, buyerSearchQuery, filterBudget, filterAcreage, filterZoning, filterUseCase, filterTimeline, filterRoadAccessBR]);

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

      <main className="pt-24 px-10 pb-20 min-h-screen max-w-[1400px] mx-auto">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-2xl">
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-4">
              Scout Your <span className="text-emerald-600">Next Deal</span>
            </h1>
            <p className="text-slate-500 font-body text-lg leading-relaxed">
              Advanced land acquisition powered by cartographic precision. Browse 2,400+ off-market listings throughout the U.S
            </p>
          </div>
          <div className="flex gap-2 bg-surface-container p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'grid' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-slate-500 hover:text-primary'
              }`}
            >
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">grid_view</span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'map' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-slate-500 hover:text-primary'
              }`}
            >
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">map</span>Map View</span>
            </button>
          </div>
        </section>

        {/* Tab toggle */}
        <div className="mb-8 flex items-center gap-1 bg-surface-container-low p-1 rounded-full w-fit">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'properties'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('buyer-requests')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'buyer-requests'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Buyer Requests
          </button>
        </div>

        {/* ── PROPERTIES TAB ── */}
        {activeTab === 'properties' && (
          <>
            {!loading && tier === 'standard' && listingsThisPeriod >= 2 && (
              <div className="mb-6">
                <ListingLimitBanner listingsUsed={listingsThisPeriod} tier="standard" />
              </div>
            )}

            {/* Search bar */}
            <div className="mb-6">
              <div className="relative max-w-xl">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by zip, city, county, state name or abbreviation..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8 mb-12">
              <div className="col-span-12 flex flex-wrap items-center gap-4 py-6 border-y border-outline-variant/20">
                {/* Lot Size */}
                {(() => {
                  const lotSizeActive = filterLotSizeAcres || (filterLotSizeUnit === 'sqft' && (filterSqFtMin || filterSqFtMax));
                  const acresLabels: Record<string, string> = { under1: '< 1 Acre', '1-5': '1–5 Acres', '5-25': '5–25 Acres', '25-100': '25–100 Acres', '100-500': '100–500 Acres', '500+': '500+ Acres' };
                  const btnLabel = lotSizeActive
                    ? (filterLotSizeUnit === 'acres' ? acresLabels[filterLotSizeAcres] : 'Lot Size (Sq Ft)')
                    : 'Lot Size';
                  return (
                    <div className="relative" data-filter-dropdown>
                      <button
                        onClick={() => setOpenFilter(openFilter === 'lotsize' ? null : 'lotsize')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                          lotSizeActive ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent hover:border-primary/20'
                        }`}
                      >
                        {btnLabel}
                        <span className="material-symbols-outlined text-sm">{openFilter === 'lotsize' ? 'expand_less' : 'expand_more'}</span>
                      </button>
                      {openFilter === 'lotsize' && (
                        <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-outline-variant/20 z-50 w-64 p-4 overflow-hidden">
                          {/* Unit toggle */}
                          <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 mb-4">
                            {(['acres', 'sqft'] as const).map(u => (
                              <button
                                key={u}
                                onClick={() => { setFilterLotSizeUnit(u); setFilterLotSizeAcres(''); setFilterSqFtMin(''); setFilterSqFtMax(''); }}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${filterLotSizeUnit === u ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-on-surface'}`}
                              >
                                {u === 'acres' ? 'Acres' : 'Sq Ft'}
                              </button>
                            ))}
                          </div>
                          {filterLotSizeUnit === 'acres' ? (
                            <div className="space-y-0.5">
                              {[['', 'Any Size'], ['under1', 'Under 1 Acre'], ['1-5', '1–5 Acres'], ['5-25', '5–25 Acres'], ['25-100', '25–100 Acres'], ['100-500', '100–500 Acres'], ['500+', '500+ Acres']].map(([val, label]) => (
                                <button key={val} onClick={() => { setFilterLotSizeAcres(val); setOpenFilter(null); }}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-surface-container-low transition-colors ${filterLotSizeAcres === val ? 'text-primary font-bold' : 'text-on-surface'}`}
                                >{label}</button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-semibold text-secondary block mb-1">Min Sq Ft</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 5000"
                                  value={filterSqFtMin}
                                  onChange={e => setFilterSqFtMin(e.target.value)}
                                  className="w-full border border-outline-variant/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-secondary block mb-1">Max Sq Ft</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 50000"
                                  value={filterSqFtMax}
                                  onChange={e => setFilterSqFtMax(e.target.value)}
                                  className="w-full border border-outline-variant/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                              <button
                                onClick={() => setOpenFilter(null)}
                                className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Zoning Type */}
                <div className="relative" data-filter-dropdown>
                  <button
                    onClick={() => setOpenFilter(openFilter === 'zoning' ? null : 'zoning')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                      filterZoning ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent hover:border-primary/20'
                    }`}
                  >
                    {filterZoning ? { agricultural: 'Agricultural', recreational: 'Recreational', residential: 'Residential', commercial: 'Commercial', mixed: 'Mixed Use', unrestricted: 'Unrestricted' }[filterZoning] ?? filterZoning : 'Zoning Type'}
                    <span className="material-symbols-outlined text-sm">{openFilter === 'zoning' ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {openFilter === 'zoning' && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-outline-variant/20 z-50 min-w-44 py-1 overflow-hidden">
                      {[['', 'Any Zoning'], ['agricultural', 'Agricultural'], ['recreational', 'Recreational'], ['residential', 'Residential'], ['commercial', 'Commercial'], ['mixed', 'Mixed Use'], ['unrestricted', 'Unrestricted']].map(([val, label]) => (
                        <button key={val} onClick={() => { setFilterZoning(val); setOpenFilter(null); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low transition-colors ${
                            filterZoning === val ? 'text-primary font-bold' : 'text-on-surface'
                          }`}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Utilities Access */}
                <div className="relative" data-filter-dropdown>
                  <button
                    onClick={() => setOpenFilter(openFilter === 'utilities' ? null : 'utilities')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                      filterUtilities ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent hover:border-primary/20'
                    }`}
                  >
                    {filterUtilities || 'Utilities Access'}
                    <span className="material-symbols-outlined text-sm">{openFilter === 'utilities' ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {openFilter === 'utilities' && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-outline-variant/20 z-50 min-w-44 py-1 overflow-hidden">
                      {[['', 'Any Utilities'], ['Water', 'Water'], ['Electric', 'Electric'], ['Gas', 'Gas'], ['Septic', 'Septic'], ['Sewer', 'Sewer']].map(([val, label]) => (
                        <button key={val} onClick={() => { setFilterUtilities(val); setOpenFilter(null); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low transition-colors ${
                            filterUtilities === val ? 'text-primary font-bold' : 'text-on-surface'
                          }`}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Road Access */}
                <div className="relative" data-filter-dropdown>
                  <button
                    onClick={() => setOpenFilter(openFilter === 'roadaccess' ? null : 'roadaccess')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                      filterRoadAccessProps ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent hover:border-primary/20'
                    }`}
                  >
                    {filterRoadAccessProps || 'Road Access'}
                    <span className="material-symbols-outlined text-sm">{openFilter === 'roadaccess' ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {openFilter === 'roadaccess' && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-outline-variant/20 z-50 min-w-48 py-1 overflow-hidden">
                      {[['', 'Any Road Access'], ['Paved Road', 'Paved Road'], ['Gravel Road', 'Gravel Road'], ['Dirt Road', 'Dirt Road'], ['Private Road', 'Private Road'], ['Easement', 'Easement'], ['No Road Access', 'No Road Access']].map(([val, label]) => (
                        <button key={val} onClick={() => { setFilterRoadAccessProps(val); setOpenFilter(null); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low transition-colors ${
                            filterRoadAccessProps === val ? 'text-primary font-bold' : 'text-on-surface'
                          }`}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                {(filterLotSizeAcres || filterSqFtMin || filterSqFtMax || filterZoning || filterUtilities || filterRoadAccessProps) && (
                  <button
                    onClick={() => { setFilterLotSizeAcres(''); setFilterSqFtMin(''); setFilterSqFtMax(''); setFilterZoning(''); setFilterUtilities(''); setFilterRoadAccessProps(''); }}
                    className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Clear filters
                  </button>
                )}
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By:</span>
                  <select
                    value={listingsSort}
                    onChange={e => setListingsSort(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="acres_asc">Lot Size: Low to High</option>
                    <option value="acres_desc">Lot Size: High to Low</option>
                    <option value="acres_desc">Acreage: Largest</option>
                  </select>
                </div>
              </div>
            </div>

            {viewMode === 'map' ? (
              mapLoading ? (
                <div className="w-full rounded-2xl bg-surface-container-low animate-pulse" style={{height:'600px'}} />
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <ListingsMap listings={mapListings as any} />
              )
            ) : listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex flex-col animate-pulse">
                    <div className="rounded-2xl bg-surface-container-low aspect-video mb-6" />
                    <div className="px-2 space-y-3">
                      <div className="flex justify-between">
                        <div className="h-5 bg-surface-container-high rounded w-40" />
                        <div className="h-5 bg-surface-container-high rounded w-20" />
                      </div>
                      <div className="h-3 bg-surface-container-high rounded w-32" />
                      <div className="h-3 bg-surface-container-high rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20 text-secondary">
                <span className="material-symbols-outlined text-5xl mb-4 block">search_off</span>
                <p className="font-headline text-xl font-bold text-primary mb-2">No listings found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredListings.map(listing => {
                  const imgSrc = listing.photos_urls?.[0] ?? PLACEHOLDER_IMG;
                  const location = [listing.county, listing.state].filter(Boolean).join(', ');
                  const acreage = formatAcreage(listing.lot_size_acres, listing.lot_size_sqft);
                  const price = formatPrice(listing.asking_price);
                  const tags = [listing.zoning, ...(listing.road_access ?? []).slice(0,1)].filter(Boolean) as string[];
                  return (
                    <Link key={listing.id} href={`/listings/${listing.id}`} className="flex flex-col group">
                      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
                        {listing.promoted && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date() && (
                          <div className="absolute top-3 left-3 z-10">
                            <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              Featured
                            </span>
                          </div>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={listing.title ?? 'Land listing'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src={imgSrc} />
                        {listing.zoning && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{listing.zoning}</span>
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm text-primary hover:scale-110 transition-transform"
                          >
                            <span className="material-symbols-outlined text-lg">favorite</span>
                          </button>
                        </div>
                      </div>
                      <div className="px-2 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-black text-primary leading-tight pr-2 line-clamp-2 overflow-hidden min-h-[3.5rem]">{listing.title}</h3>
                          <span className="text-2xl font-black text-primary whitespace-nowrap">{price}</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-4">{location}{acreage ? ` • ${acreage}` : ''}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tags.map(tag => (
                            <span key={tag} className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{tag}</span>
                          ))}
                        </div>
                        {profile?.id && listing.user_id === profile.id && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBoostModal({ listingId: listing.id, title: listing.title ?? 'Your Listing' }); }}
                            className="mb-3 w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 py-2 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                            {listing.promoted && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date() ? 'Boosted ✓' : 'Boost Listing'}
                          </button>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
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
                <option value="50k-100k">$50K–$100K</option>
                <option value="100k-500k">$100K–$500K</option>
                <option value="500k-1m">$500K–$1M</option>
                <option value="1m-5m">$1M–$5M</option>
                <option value="5m+">$5M+</option>
              </select>
              <select
                value={filterAcreage}
                onChange={e => setFilterAcreage(e.target.value)}
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
                <option value="1-3 months">1–3 months</option>
                <option value="3-6 months">3–6 months</option>
                <option value="6+ months">6+ months</option>
              </select>
              <select
                value={filterRoadAccessBR}
                onChange={e => setFilterRoadAccessBR(e.target.value)}
                className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Road Access</option>
                <option value="Paved Road">Paved Road</option>
                <option value="Gravel Road">Gravel Road</option>
                <option value="Dirt Road">Dirt Road</option>
                <option value="Private Road">Private Road</option>
                <option value="Easement">Easement</option>
                <option value="No Road Access">No Road Access</option>
              </select>
              {(filterBudget || filterAcreage || filterZoning || filterUseCase || filterTimeline || filterRoadAccessBR || buyerSearchQuery) && (
                <button
                  onClick={() => { setFilterBudget(''); setFilterAcreage(''); setFilterZoning(''); setFilterUseCase(''); setFilterTimeline(''); setFilterRoadAccessBR(''); setBuyerSearchQuery(''); }}
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
                              {req.min_acreage}{req.max_acreage ? ` – ${req.max_acreage}` : '+'} acres
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

      {/* Boost Modal */}
      {boostModal && (
        <BoostModal
          listingId={boostModal.listingId}
          listingTitle={boostModal.title}
          tier={tier ?? 'standard'}
          onClose={() => setBoostModal(null)}
        />
      )}

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
