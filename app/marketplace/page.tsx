'use client';

import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
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
import SendMessageModal from '@/components/SendMessageModal';

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

// Reverse map: abbreviation → title-cased full name
const STATE_ABBREVS: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([name, abbrev]) => [
    abbrev,
    name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  ])
);

interface Listing {
  id: string;
  title: string | null;
  property_description: string | null;
  state: string | null;
  county: string | null;
  zip_code: string | null;
  street_address: string | null;
  apn: string | null;
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
  target_state: string | null;
  target_city: string | null;
  target_county: string | null;
  display_name: string | null;
  display_company: string | null;
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

function fmtPerAcreMkt(budgetMax: number | null, minAcreage: number | null, budgetMin: number | null): string {
  const budget = budgetMax ?? budgetMin;
  if (!budget || !minAcreage || minAcreage <= 0) {
    const f = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
    if (budgetMin && budgetMax) return `${f(budgetMin)} – ${f(budgetMax)}`;
    if (budgetMin) return `${f(budgetMin)}+`;
    if (budgetMax) return `Up to ${f(budgetMax)}`;
    return 'Flexible';
  }
  if (minAcreage < 10000 / 43560) {
    const perSqFt = budget / (minAcreage * 43560);
    return `$${Math.round(perSqFt).toLocaleString()}/sq ft`;
  }
  return `$${Math.round(budget / minAcreage).toLocaleString()}/acre`;
}

function fmtTimelineMkt(t: string): string {
  if (/actively buying|0.30 days/i.test(t)) return 'Under 30 days';
  if (/1.3 month/i.test(t)) return '1–3 months';
  if (/3.6 month/i.test(t)) return '3–6 months';
  if (/flexible|6\+/i.test(t)) return 'Flexible';
  return t;
}

function applyBudgetFilter(req: BuyerRequest, f: string): boolean {
  const max = req.budget_max ?? 0;
  const min = req.budget_min ?? 0;
  if (!f) return true;
  if (f === 'under50k') return max < 50_000;
  if (f === '50k-100k') return max >= 50_000 && max < 100_000;
  if (f === '100k-500k') return max >= 100_000 && max < 500_000;
  if (f === '500k-1m') return max >= 500_000 && max < 1_000_000;
  if (f === '1m-5m') return max >= 1_000_000 && max < 5_000_000;
  if (f === '5m+') return (max || min) >= 5_000_000;
  return true;
}

function applyAcreageFilter(req: BuyerRequest, f: string): boolean {
  const acres = req.min_acreage ?? 0;
  if (!f) return true;
  if (f === 'under5') return acres < 5;
  if (f === '5-25') return acres >= 5 && acres < 25;
  if (f === '25-100') return acres >= 25 && acres < 100;
  if (f === '100-500') return acres >= 100 && acres < 500;
  if (f === '500+') return acres >= 500;
  return true;
}

function timelineSortKey(t: string | null): number {
  if (!t) return 999;
  if (/actively buying|0.30 days/i.test(t)) return 0;
  if (/1.3 month/i.test(t)) return 1;
  if (/3.6 month/i.test(t)) return 2;
  if (/6\+|flexible/i.test(t)) return 3;
  return 999;
}

const BR_SELECT_CLS = 'bg-surface-container-low px-3 py-2 rounded-lg border border-transparent hover:border-primary/20 text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all';

export default function MarketplacePage() {
  const { tier, profile, loading, listingsThisPeriod, listingStatus } = usePermissions();
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [showBuyerFreeModal, setShowBuyerFreeModal] = useState(false);
  const [showContactUpgradeModal, setShowContactUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'buyer-requests'>('properties');
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsSort, setListingsSort] = useState('recommended');
  const [viewMode, setViewMode] = useState<'grid'|'map'>('grid');
  const [mapListings, setMapListings] = useState<unknown[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [buyerRequestsLoading, setBuyerRequestsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [filterAcreage, setFilterAcreage] = useState('');
  const [filterZoning, setFilterZoning] = useState<string[]>([]);
  const [filterUtilities, setFilterUtilities] = useState<string[]>([]);
  const [filterTimeline, setFilterTimeline] = useState('');
  const [filterZoningBR, setFilterZoningBR] = useState('');
  const [filterLotSizeUnit, setFilterLotSizeUnit] = useState<'acres' | 'sqft'>('acres');
  const [filterLotSizeMin, setFilterLotSizeMin] = useState('');
  const [filterLotSizeMax, setFilterLotSizeMax] = useState('');
  const [filterSqFtMin, setFilterSqFtMin] = useState('');
  const [filterSqFtMax, setFilterSqFtMax] = useState('');
  const [filterRoadAccessProps, setFilterRoadAccessProps] = useState<string[]>([]);
  const [filterRoadAccessBR, setFilterRoadAccessBR] = useState('');

  function toggleMultiFilter<T extends string>(setter: React.Dispatch<React.SetStateAction<T[]>>, val: T) {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [boostModal, setBoostModal] = useState<{ listingId: string; title: string } | null>(null);
  const [messagingRecipient, setMessagingRecipient] = useState<{ id: string; name: string } | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [userCriteria, setUserCriteria] = useState<any | null>(null);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [brSort, setBrSort] = useState('newest');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-filter-dropdown]')) setOpenFilter(null);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load user's saved/favorited listings
  useEffect(() => {
    if (!profile?.id) return;
    fetch('/api/favorites')
      .then(r => r.json())
      .then(({ favorites }) => { if (favorites) setSavedListingIds(new Set(favorites)); })
      .catch(() => {});
  }, [profile?.id]);

  async function toggleFavorite(e: React.MouseEvent, listingId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.id) { router.push('/login'); return; }
    setSavingId(listingId);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const { saved } = await res.json();
      setSavedListingIds(prev => {
        const next = new Set(prev);
        if (saved) next.add(listingId); else next.delete(listingId);
        return next;
      });
    } catch {}
    finally { setSavingId(null); }
  }

  // Load user's buyer criteria for Recommended sort
  useEffect(() => {
    if (!profile?.id) return;
    const supabase = createClient();
    supabase
      .from('buyer_requests')
      .select('target_regions,budget_min,budget_max,min_acreage,max_acreage,zoning_preference,use_case')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setUserCriteria(data); });
  }, [profile?.id]);

  function scoreListingForUser(listing: Listing, criteria: any): number {
    let score = 0;
    // Promoted boost
    if (listing.promoted && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date()) score += 40;
    if (!criteria) return score;
    // Region match
    if (criteria.target_regions?.length > 0) {
      const s = (listing.state ?? '').toLowerCase();
      const match = criteria.target_regions.some((r: string) => r.toLowerCase().includes(s) || s.includes(r.toLowerCase()));
      if (match) score += 30;
    }
    // Budget match
    if (listing.asking_price) {
      if (criteria.budget_max && listing.asking_price <= criteria.budget_max) score += 15;
      if (criteria.budget_min && listing.asking_price >= criteria.budget_min) score += 5;
    }
    // Acreage match
    if (listing.lot_size_acres) {
      if (criteria.min_acreage && listing.lot_size_acres >= criteria.min_acreage) score += 10;
      if (criteria.max_acreage && listing.lot_size_acres <= criteria.max_acreage) score += 5;
    }
    // Zoning match
    if (criteria.zoning_preference?.length > 0 && listing.zoning) {
      const z = listing.zoning.toLowerCase();
      if (criteria.zoning_preference.some((p: string) => z.includes(p.toLowerCase()))) score += 10;
    }
    return score;
  }

  const canViewContact = !loading && !!tier;
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
    fetch('/api/buyer-directory?status=active&limit=200')
      .then(r => r.json())
      .then(({ requests }) => {
        setBuyerRequests((requests ?? []) as BuyerRequest[]);
        setBuyerRequestsLoading(false);
      })
      .catch(() => setBuyerRequestsLoading(false));
  }, [activeTab]);

  const filteredListings = useMemo(() => {
    let result = listings;

    // Search — resolves full state names and abbreviations to 2-letter code
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      const qLow = q.toLowerCase();
      // Full name → abbreviation (e.g. "north carolina" → "NC")
      const abbrevFromName = STATE_NAMES[qLow] ?? '';
      // Typed abbreviation (e.g. "NC") — only if it's a known state code
      const abbrevFromInput = (q.length === 2 && STATE_ABBREVS[q.toUpperCase()]) ? q.toUpperCase() : '';
      const stateAbbrev = abbrevFromName || abbrevFromInput;
      result = result.filter(l =>
        (stateAbbrev
          ? (l.state ?? '').toUpperCase() === stateAbbrev
          : (l.state ?? '').toLowerCase().includes(qLow)
        ) ||
        (l.county ?? '').toLowerCase().includes(qLow) ||
        (l.zip_code ?? '').includes(qLow)
      );
    }

    // Lot size filter
    if (filterLotSizeUnit === 'acres' && (filterLotSizeMin || filterLotSizeMax)) {
      const minAc = filterLotSizeMin ? Number(filterLotSizeMin) : null;
      const maxAc = filterLotSizeMax ? Number(filterLotSizeMax) : null;
      result = result.filter(l => {
        const acres = l.lot_size_acres ?? (l.lot_size_sqft ? l.lot_size_sqft / 43560 : null);
        if (acres === null) return true;
        if (minAc !== null && acres < minAc) return false;
        if (maxAc !== null && acres > maxAc) return false;
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

    // Road access filter (multi-select — OR logic)
    if (filterRoadAccessProps.length > 0) {
      result = result.filter(l =>
        filterRoadAccessProps.some(f =>
          (l.road_access ?? []).some((r: string) => r.toLowerCase().includes(f.toLowerCase()))
        )
      );
    }

    // Zoning filter (multi-select — OR logic)
    if (filterZoning.length > 0) {
      result = result.filter(l => {
        const z = (l.zoning ?? '').toLowerCase();
        return filterZoning.some(fz => {
          if (fz === 'agricultural') return /ag|a-1|a-d|ae-|a_1|agricultural/.test(z);
          if (fz === 'recreational') return z.includes('rec');
          if (fz === 'residential') return z.includes('res') || z === 'rr' || /rr-/.test(z);
          if (fz === 'commercial') return z.includes('com');
          if (fz === 'mixed') return z.includes('mix');
          if (fz === 'unrestricted') return z.includes('unrest') || z === 'any';
          return z.includes(fz.toLowerCase());
        });
      });
    }

    // Utilities filter (multi-select — OR logic)
    if (filterUtilities.length > 0) {
      result = result.filter(l => {
        const utils = (l.utilities ?? []).map((u: string) => u.toLowerCase());
        return filterUtilities.some(f => utils.some((u: string) => u.includes(f.toLowerCase())));
      });
    }

    // Recommended sort — score against user's saved criteria
    if (listingsSort === 'recommended') {
      result = [...result].sort((a, b) => scoreListingForUser(b, userCriteria) - scoreListingForUser(a, userCriteria));
    }

    return result;
  }, [listings, searchQuery, filterLotSizeUnit, filterLotSizeMin, filterLotSizeMax, filterSqFtMin, filterSqFtMax, filterRoadAccessProps, filterZoning, filterUtilities, listingsSort, userCriteria]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBuyerRequests = useMemo(() => {
    const filtered = buyerRequests.filter(req => {
      const q = buyerSearchQuery.toLowerCase();
      const state = (req.target_state ?? '').toLowerCase();
      const regions = (req.target_regions ?? []).join(' ').toLowerCase();
      const uc = (req.use_case ?? '').toLowerCase();
      const matchSearch = !q || state.includes(q) || regions.includes(q) || uc.includes(q);
      const matchBudget = applyBudgetFilter(req, filterBudget);
      const matchAcreage = applyAcreageFilter(req, filterAcreage);
      const matchZoning = !filterZoningBR || (req.zoning_preference ?? []).some(z => z.toLowerCase().includes(filterZoningBR));
      const matchTimeline = !filterTimeline || (req.timeline ?? '').includes(filterTimeline);
      const roads = ((req as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !filterRoadAccessBR || roads.some(rd => rd.toLowerCase().includes(filterRoadAccessBR.toLowerCase()));
      return matchSearch && matchBudget && matchAcreage && matchZoning && matchTimeline && matchRoad;
    });
    return [...filtered].sort((a, b) => {
      if (brSort === 'budget_desc') return (b.budget_max ?? b.budget_min ?? 0) - (a.budget_max ?? a.budget_min ?? 0);
      if (brSort === 'budget_asc') return (a.budget_max ?? a.budget_min ?? 0) - (b.budget_max ?? b.budget_min ?? 0);
      if (brSort === 'timeline') return timelineSortKey(a.timeline) - timelineSortKey(b.timeline);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [buyerRequests, buyerSearchQuery, filterBudget, filterAcreage, filterZoningBR, filterTimeline, filterRoadAccessBR, brSort]);

  // State autocomplete suggestions
  const stateSuggestions = useMemo(() => {
    const q = searchQuery.trim();
    const qLow = q.toLowerCase();
    if (q.length < 2) return [];
    const seen = new Set<string>();
    const results: { label: string; stateName: string; abbrev: string }[] = [];
    // Abbreviation exact match (e.g. "NC")
    if (q.length === 2) {
      const abbrev = q.toUpperCase();
      const fullName = STATE_ABBREVS[abbrev];
      if (fullName && !seen.has(abbrev)) {
        seen.add(abbrev);
        results.push({ label: `${fullName} (${abbrev})`, stateName: fullName, abbrev });
      }
    }
    // Full-name prefix match (e.g. "nor" → "North Carolina", "North Dakota")
    for (const [name, abbrev] of Object.entries(STATE_NAMES)) {
      if (name.startsWith(qLow) && !seen.has(abbrev)) {
        seen.add(abbrev);
        const titleName = STATE_ABBREVS[abbrev];
        results.push({ label: `${titleName} (${abbrev})`, stateName: titleName, abbrev });
        if (results.length >= 6) break;
      }
    }
    return results.slice(0, 6);
  }, [searchQuery]);

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
            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
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
            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
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
            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
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

      {/* Send message modal */}
      {messagingRecipient && profile?.id && (
        <SendMessageModal
          recipientId={messagingRecipient.id}
          recipientName={messagingRecipient.name}
          currentUserId={profile.id}
          currentUserIsBuyer={false}
          onClose={() => setMessagingRecipient(null)}
          onSent={() => {
            setMessagingRecipient(null);
            setToastMsg('Message sent successfully');
            setTimeout(() => setToastMsg(''), 3000);
          }}
        />
      )}

      {/* Success toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toastMsg}
        </div>
      )}

      <main className="pt-24 px-4 sm:px-6 md:px-10 pb-20 min-h-screen max-w-[1400px] mx-auto">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-2xl">
            <h1 className="font-headline text-2xl sm:text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-4">
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
              <div className="relative max-w-xl" ref={searchContainerRef}>
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search by state, zip, county, or city..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-10 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}

                {/* State autocomplete dropdown */}
                {showSuggestions && stateSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-50 overflow-hidden">
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-secondary/60">States</p>
                    {stateSuggestions.map(({ label, stateName, abbrev }) => (
                      <button
                        key={abbrev}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(stateName);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-emerald-50 hover:text-primary transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-base text-secondary/60">location_on</span>
                        <span className="flex-1">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8 mb-12">
              <div className="col-span-12 flex flex-wrap items-center gap-4 py-6 border-y border-outline-variant/20">
                {/* Lot Size */}
                {(() => {
                  const lotSizeActive = filterLotSizeMin || filterLotSizeMax || filterSqFtMin || filterSqFtMax;
                  const btnLabel = lotSizeActive
                    ? (filterLotSizeUnit === 'acres' ? 'Lot Size (Acres)' : 'Lot Size (Sq Ft)')
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
                                onClick={() => { setFilterLotSizeUnit(u); setFilterLotSizeMin(''); setFilterLotSizeMax(''); setFilterSqFtMin(''); setFilterSqFtMax(''); }}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${filterLotSizeUnit === u ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-on-surface'}`}
                              >
                                {u === 'acres' ? 'Acres' : 'Sq Ft'}
                              </button>
                            ))}
                          </div>
                          {filterLotSizeUnit === 'acres' ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-semibold text-secondary block mb-1">Min Acres</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 5"
                                  value={filterLotSizeMin}
                                  onChange={e => setFilterLotSizeMin(e.target.value)}
                                  className="w-full border border-outline-variant/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-secondary block mb-1">Max Acres</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 500"
                                  value={filterLotSizeMax}
                                  onChange={e => setFilterLotSizeMax(e.target.value)}
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

                {/* Zoning Type — multi-select */}
                <div className="relative" data-filter-dropdown>
                  <button
                    onClick={() => setOpenFilter(openFilter === 'zoning' ? null : 'zoning')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                      filterZoning.length > 0 ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent hover:border-primary/20'
                    }`}
                  >
                    {filterZoning.length > 0 ? `Zoning (${filterZoning.length})` : 'Zoning Type'}
                    <span className="material-symbols-outlined text-sm">{openFilter === 'zoning' ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {openFilter === 'zoning' && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-outline-variant/20 z-50 min-w-48 py-2 overflow-hidden">
                      {[['agricultural', 'Agricultural'], ['recreational', 'Recreational'], ['residential', 'Residential'], ['commercial', 'Commercial'], ['mixed', 'Mixed Use'], ['unrestricted', 'Unrestricted']].map(([val, label]) => (
                        <button key={val} onClick={() => toggleMultiFilter(setFilterZoning, val)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-container-low transition-colors text-on-surface"
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            filterZoning.includes(val) ? 'bg-primary border-primary' : 'border-outline-variant'
                          }`}>
                            {filterZoning.includes(val) && <span className="material-symbols-outlined text-white" style={{fontSize:'12px'}}>check</span>}
                          </span>
                          {label}
                        </button>
                      ))}
                      {filterZoning.length > 0 && (
                        <button onClick={() => setFilterZoning([])} className="w-full text-xs text-secondary hover:text-primary px-4 py-2 border-t border-outline-variant/20 mt-1 transition-colors">
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Utilities Access — multi-select */}
                <div className="relative" data-filter-dropdown>
                  <button
                    onClick={() => setOpenFilter(openFilter === 'utilities' ? null : 'utilities')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                      filterUtilities.length > 0 ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent hover:border-primary/20'
                    }`}
                  >
                    {filterUtilities.length > 0 ? `Utilities (${filterUtilities.length})` : 'Utilities Access'}
                    <span className="material-symbols-outlined text-sm">{openFilter === 'utilities' ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {openFilter === 'utilities' && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-outline-variant/20 z-50 min-w-44 py-2 overflow-hidden">
                      {['Water', 'Electric', 'Gas', 'Septic', 'Sewer'].map((val) => (
                        <button key={val} onClick={() => toggleMultiFilter(setFilterUtilities, val)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-container-low transition-colors text-on-surface"
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            filterUtilities.includes(val) ? 'bg-primary border-primary' : 'border-outline-variant'
                          }`}>
                            {filterUtilities.includes(val) && <span className="material-symbols-outlined text-white" style={{fontSize:'12px'}}>check</span>}
                          </span>
                          {val}
                        </button>
                      ))}
                      {filterUtilities.length > 0 && (
                        <button onClick={() => setFilterUtilities([])} className="w-full text-xs text-secondary hover:text-primary px-4 py-2 border-t border-outline-variant/20 mt-1 transition-colors">
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Road Access — multi-select */}
                <div className="relative" data-filter-dropdown>
                  <button
                    onClick={() => setOpenFilter(openFilter === 'roadaccess' ? null : 'roadaccess')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                      filterRoadAccessProps.length > 0 ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent hover:border-primary/20'
                    }`}
                  >
                    {filterRoadAccessProps.length > 0 ? `Road Access (${filterRoadAccessProps.length})` : 'Road Access'}
                    <span className="material-symbols-outlined text-sm">{openFilter === 'roadaccess' ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {openFilter === 'roadaccess' && (
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-outline-variant/20 z-50 min-w-48 py-2 overflow-hidden">
                      {['Paved Road', 'Gravel Road', 'Dirt Road', 'Private Road', 'Easement', 'No Road Access'].map((val) => (
                        <button key={val} onClick={() => toggleMultiFilter(setFilterRoadAccessProps, val)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-container-low transition-colors text-on-surface"
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            filterRoadAccessProps.includes(val) ? 'bg-primary border-primary' : 'border-outline-variant'
                          }`}>
                            {filterRoadAccessProps.includes(val) && <span className="material-symbols-outlined text-white" style={{fontSize:'12px'}}>check</span>}
                          </span>
                          {val}
                        </button>
                      ))}
                      {filterRoadAccessProps.length > 0 && (
                        <button onClick={() => setFilterRoadAccessProps([])} className="w-full text-xs text-secondary hover:text-primary px-4 py-2 border-t border-outline-variant/20 mt-1 transition-colors">
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {(filterLotSizeMin || filterLotSizeMax || filterSqFtMin || filterSqFtMax || filterZoning.length > 0 || filterUtilities.length > 0 || filterRoadAccessProps.length > 0) && (
                  <button
                    onClick={() => { setFilterLotSizeMin(''); setFilterLotSizeMax(''); setFilterSqFtMin(''); setFilterSqFtMax(''); setFilterZoning([]); setFilterUtilities([]); setFilterRoadAccessProps([]); }}
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
                    <option value="recommended">Recommended</option>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-10">
                {filteredListings.map(listing => {
                  const imgSrc = listing.photos_urls?.[0] ?? PLACEHOLDER_IMG;
                  const acreage = formatAcreage(listing.lot_size_acres, listing.lot_size_sqft);
                  const price = formatPrice(listing.asking_price);
                  const addressLine = listing.street_address?.trim()
                    ? listing.street_address
                    : listing.apn
                    ? `APN ${listing.apn}`
                    : 'Undisclosed Address';
                  const countyState = [
                    listing.county ? `${listing.county} County` : null,
                    listing.state,
                  ].filter(Boolean).join(', ');
                  return (
                    <Link key={listing.id} href={`/listings/${listing.id}`} className="flex flex-col group rounded-2xl overflow-hidden border border-outline-variant/15 bg-white hover:shadow-lg hover:border-outline-variant/30 transition-all">
                      {/* Image */}
                      <div className="relative overflow-hidden bg-surface-container-low aspect-video">
                        {listing.promoted && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date() && (
                          <div className="absolute top-3 left-3 z-10">
                            <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              Featured
                            </span>
                          </div>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="Land listing" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={imgSrc} />
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={(e) => toggleFavorite(e, listing.id)}
                            disabled={savingId === listing.id}
                            className={`bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-sm transition-transform hover:scale-110 disabled:opacity-60 ${
                              savedListingIds.has(listing.id) ? 'text-red-500' : 'text-slate-500'
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-base"
                              style={{ fontVariationSettings: savedListingIds.has(listing.id) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              favorite
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-2xl font-extrabold text-primary leading-tight">{price}</p>
                        {acreage && <p className="text-sm font-bold text-on-surface mt-0.5">{acreage}</p>}
                        <p className="text-sm text-secondary mt-1.5 truncate">{addressLine}</p>
                        {countyState && <p className="text-xs text-secondary/70 mt-0.5">{countyState}</p>}
                        {listing.zoning && (
                          <div className="mt-3">
                            <span className="inline-block bg-surface-container-high px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">{listing.zoning}</span>
                          </div>
                        )}
                        {profile?.id && listing.user_id === profile.id && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBoostModal({ listingId: listing.id, title: listing.title ?? 'Your Listing' }); }}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 py-2 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors"
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
            <div className="flex flex-wrap items-center gap-3 py-4 border-y border-outline-variant/20 mb-6">
              <select value={filterBudget} onChange={e => setFilterBudget(e.target.value)} className={BR_SELECT_CLS}>
                <option value="" disabled hidden>Budget Range</option>
                <option value="under50k">Under $50K</option>
                <option value="50k-100k">$50K–$100K</option>
                <option value="100k-500k">$100K–$500K</option>
                <option value="500k-1m">$500K–$1M</option>
                <option value="1m-5m">$1M–$5M</option>
                <option value="5m+">$5M+</option>
              </select>
              <select value={filterAcreage} onChange={e => setFilterAcreage(e.target.value)} className={BR_SELECT_CLS}>
                <option value="" disabled hidden>Acreage Range</option>
                <option value="under5">Under 5 acres</option>
                <option value="5-25">5–25 acres</option>
                <option value="25-100">25–100 acres</option>
                <option value="100-500">100–500 acres</option>
                <option value="500+">500+ acres</option>
              </select>
              <select value={filterZoningBR} onChange={e => setFilterZoningBR(e.target.value)} className={BR_SELECT_CLS}>
                <option value="" disabled hidden>Zoning Type</option>
                <option value="agricultural">Agricultural</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="mixed use">Mixed Use</option>
                <option value="recreational">Recreational</option>
                <option value="other">Other</option>
              </select>
              <select value={filterTimeline} onChange={e => setFilterTimeline(e.target.value)} className={BR_SELECT_CLS}>
                <option value="" disabled hidden>Timeline</option>
                <option value="Actively Buying">Actively Buying</option>
                <option value="1-3 months">1–3 months</option>
                <option value="3-6 months">3–6 months</option>
                <option value="6+ months">6+ months</option>
              </select>
              <select value={filterRoadAccessBR} onChange={e => setFilterRoadAccessBR(e.target.value)} className={BR_SELECT_CLS}>
                <option value="" disabled hidden>Road Access</option>
                <option value="Paved Road">Paved Road</option>
                <option value="Gravel Road">Gravel Road</option>
                <option value="Dirt Road">Dirt Road</option>
                <option value="Private Road">Private Road</option>
                <option value="Easement">Easement</option>
                <option value="No Road Access">No Road Access</option>
              </select>
              {(filterBudget || filterAcreage || filterZoningBR || filterTimeline || filterRoadAccessBR || buyerSearchQuery) && (
                <button
                  onClick={() => { setFilterBudget(''); setFilterAcreage(''); setFilterZoningBR(''); setFilterTimeline(''); setFilterRoadAccessBR(''); setBuyerSearchQuery(''); }}
                  className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Clear filters
                </button>
              )}
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By:</span>
                <select
                  value={brSort}
                  onChange={e => setBrSort(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="budget_desc">Budget High to Low</option>
                  <option value="budget_asc">Budget Low to High</option>
                  <option value="timeline">Timeline Soonest First</option>
                </select>
              </div>
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
                  const company = req.display_company || null;
                  const personName = req.display_name ||
                    [req.profiles?.first_name, req.profiles?.last_name].filter(Boolean).join(' ') || null;
                  const primaryName = company || personName || 'Anonymous Buyer';
                  const secondaryName = company ? personName : null;
                  const blurIdentity = !loading && !canViewContact;
                  const stateAbbrev = req.target_state ? (STATE_NAMES[req.target_state.toLowerCase()] ?? null) : null;
                  let location: string;
                  if (req.target_city && req.target_state) location = `${req.target_city}, ${stateAbbrev ?? req.target_state}`;
                  else if (req.target_county && req.target_state) location = `${req.target_county} County, ${stateAbbrev ?? req.target_state}`;
                  else location = req.target_state || 'Location not specified';
                  const perAcre = fmtPerAcreMkt(req.budget_max, req.min_acreage, req.budget_min);
                  const timeline = req.timeline ? fmtTimelineMkt(req.timeline) : null;

                  return (
                    <Link
                      key={req.id}
                      href={`/buyer-requests/${req.id}`}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 flex flex-col hover:shadow-lg hover:border-primary/25 transition-all overflow-hidden"
                    >
                      <div className={blurIdentity ? 'blur-sm select-none' : ''}>
                        {primaryName && <p className="font-extrabold text-primary text-base leading-snug">{primaryName}</p>}
                        {secondaryName && <p className="text-xs text-secondary font-medium mt-0.5 line-clamp-1">{secondaryName}</p>}
                      </div>
                      <div className="mt-3 space-y-2">
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-secondary/70">Location</p><p className={`text-sm font-bold ${location === 'Location not specified' ? 'text-secondary/50 italic' : 'text-on-surface'}`}>{location}</p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-secondary/70">Budget</p><p className="text-sm font-bold text-on-surface">{perAcre}</p></div>
                        {timeline && (<div><p className="text-[10px] font-black uppercase tracking-widest text-secondary/70">Timeline</p><p className="text-sm font-bold text-on-surface">{timeline}</p></div>)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="w-full py-10 px-4 sm:px-8 bg-primary dark:bg-black grid grid-cols-1 md:grid-cols-2 items-center gap-8 z-10 relative">
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
      <div className="fixed bottom-6 right-6 z-[60]">
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
