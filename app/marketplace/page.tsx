'use client';

import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';

const ListingsMap = dynamic(() => import('@/components/ListingsMap'), { ssr: false, loading: () => <div className="w-full h-full rounded-2xl bg-surface-container-low animate-pulse" /> });
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
  city: string | null;
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
  owner_name: string | null;
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
  return `$${n.toLocaleString()}`;
}

function formatAcreage(acres: number | null, sqft: number | null): string {
  const acresText = acres ? `${acres.toLocaleString(undefined, { maximumFractionDigits: 2 })} Acres` : '';
  const sqftText = sqft ? `${sqft.toLocaleString()} Sq Ft` : '';
  return [acresText, sqftText].filter(Boolean).join(' / ');
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80';

const LISTING_STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: 'Published', className: 'bg-emerald-600 text-white' },
  published: { label: 'Published', className: 'bg-emerald-600 text-white' },
  pending_review: { label: 'Under Review', className: 'bg-amber-500 text-white' },
  revision_needed: { label: 'Under Review', className: 'bg-amber-500 text-white' },
  sold: { label: 'Sold', className: 'bg-blue-600 text-white' },
  draft: { label: 'Draft', className: 'bg-slate-600 text-white' },
  rejected: { label: 'Rejected', className: 'bg-red-600 text-white' },
};

function getListingStatusMeta(status: string) {
  return LISTING_STATUS_META[status] ?? {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    className: 'bg-slate-600 text-white',
  };
}

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

// Seller display names are resolved via getSellerName (single source of truth).

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


export default function MarketplacePage() {
  const { tier, profile, loading, listingsThisPeriod, listingStatus } = usePermissions();
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsSort, setListingsSort] = useState('recommended');
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [mapListings, setMapListings] = useState<unknown[]>([]);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZoning, setFilterZoning] = useState<string[]>([]);
  const [filterUtilities, setFilterUtilities] = useState<string[]>([]);
  const [filterLotSizeUnit, setFilterLotSizeUnit] = useState<'acres' | 'sqft'>('acres');
  const [filterLotSizeMin, setFilterLotSizeMin] = useState('');
  const [filterLotSizeMax, setFilterLotSizeMax] = useState('');
  const [filterSqFtMin, setFilterSqFtMin] = useState('');
  const [filterSqFtMax, setFilterSqFtMax] = useState('');
  const [filterRoadAccessProps, setFilterRoadAccessProps] = useState<string[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

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

  const isFreeUser = !loading && !tier;
  const isPaidUser = !loading && !!tier;

  // Read map collapse preference and fetch all map listings on mount
  useEffect(() => {
    if (localStorage.getItem('lotscout_map_collapsed') === 'true') setMapCollapsed(true);
    fetch('/api/listings/map')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMapListings(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setListingsLoading(true);
    const params = new URLSearchParams({ sort: listingsSort, limit: '200' });
    if (showMyListings && profile?.id) params.set('mine', 'true');
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
  }, [listingsSort, showMyListings, profile?.id]);

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
        (l.city ?? '').toLowerCase().includes(qLow) ||
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

    // Always push listings without images to the bottom (stable — preserves ordering within each group)
    result = [...result].sort((a, b) => {
      const aHasImg = (a.photos_urls?.length ?? 0) > 0;
      const bHasImg = (b.photos_urls?.length ?? 0) > 0;
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      return 0;
    });

    return result;
  }, [listings, searchQuery, filterLotSizeUnit, filterLotSizeMin, filterLotSizeMax, filterSqFtMin, filterSqFtMax, filterRoadAccessProps, filterZoning, filterUtilities, listingsSort, userCriteria]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMyListingsClick() {
    if (!profile?.id) {
      router.push('/login');
      return;
    }
    setShowMyListings(prev => !prev);
  }

  // IDs of listings that pass current filters — used to dim non-matching map pins
  const filteredMapIds = useMemo(
    () => new Set(filteredListings.map(l => l.id)),
    [filteredListings]
  );

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

  function toggleMap() {
    setMapCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('lotscout_map_collapsed', String(next));
      return next;
    });
  }

  const handlePinClick = useCallback((listingId: string) => {
    const el = cardRefs.current.get(listingId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHoveredListingId(listingId);
      setTimeout(() => setHoveredListingId(null), 2000);
    }
  }, []);

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
        <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl">
            <h1 className="font-headline text-2xl sm:text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-4">
              Scout Your <span className="text-emerald-600">Next Deal</span>
            </h1>
            <p className="text-slate-500 font-body text-lg leading-relaxed">
              Advanced land acquisition powered by cartographic precision. Browse 2,400+ off-market listings throughout the U.S
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <button
              type="button"
              onClick={handleMyListingsClick}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold shadow-sm transition-all ${
                showMyListings
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-white text-primary border border-outline-variant/25 hover:border-primary/30 hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              My Listings
            </button>
            <Link
              href="/create-listing"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Create Listing
            </Link>
          </div>
        </section>


        {/* ── PROPERTIES ── */}
        <>
            {!loading && tier === 'standard' && listingsThisPeriod >= 2 && (
              <div className="mb-6">
                <ListingLimitBanner listingsUsed={listingsThisPeriod} tier="standard" />
              </div>
            )}

            {/* Map — always visible, collapsible */}
            <div className="mb-4">
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out rounded-2xl"
                style={{ maxHeight: mapCollapsed ? 0 : 380 }}
              >
                <div className="relative h-[220px] sm:h-[380px]">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <ListingsMap
                    listings={mapListings as any}
                    filteredIds={filteredMapIds}
                    highlightedId={hoveredListingId}
                    onPinClick={handlePinClick}
                  />
                  <button
                    onClick={toggleMap}
                    className="absolute top-3 right-3 z-[1001] text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/90 backdrop-blur-sm border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                  >
                    Hide Map ▲
                  </button>
                </div>
              </div>
              {mapCollapsed && (
                <button
                  onClick={toggleMap}
                  className="mt-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
                >
                  Show Map ▼
                </button>
              )}
            </div>

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

            {/* Mobile filter button — only visible on small screens */}
            <div className="flex md:hidden items-center gap-3 mb-4">
              {(() => {
                const activeCount = (filterLotSizeMin || filterLotSizeMax || filterSqFtMin || filterSqFtMax ? 1 : 0)
                  + filterZoning.length + filterUtilities.length + filterRoadAccessProps.length;
                return (
                  <button
                    onClick={() => setShowFilterDrawer(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                      activeCount > 0 ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-primary border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">tune</span>
                    Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                  </button>
                );
              })()}
              <select
                value={listingsSort}
                onChange={e => setListingsSort(e.target.value)}
                className="bg-surface-container-low border-none rounded-lg px-3 py-2.5 text-sm font-bold text-primary focus:ring-0 cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="acres_asc">Acres: Small → Large</option>
                <option value="acres_desc">Acres: Large → Small</option>
              </select>
            </div>

            {/* Mobile filter drawer */}
            {showFilterDrawer && (
              <div className="fixed inset-0 z-[2000] md:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilterDrawer(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10 sticky top-0 bg-white z-10">
                    <h2 className="font-headline text-base font-bold text-primary">Filters</h2>
                    <button onClick={() => setShowFilterDrawer(false)} className="text-secondary hover:text-on-surface">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="px-5 py-4 space-y-6">

                    {/* Lot Size */}
                    <div>
                      <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Lot Size</p>
                      <div className="flex gap-2 bg-surface-container-low rounded-lg p-1 mb-3">
                        {(['acres', 'sqft'] as const).map(u => (
                          <button
                            key={u}
                            onClick={() => { setFilterLotSizeUnit(u); setFilterLotSizeMin(''); setFilterLotSizeMax(''); setFilterSqFtMin(''); setFilterSqFtMax(''); }}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${filterLotSizeUnit === u ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
                          >
                            {u === 'acres' ? 'Acres' : 'Sq Ft'}
                          </button>
                        ))}
                      </div>
                      {filterLotSizeUnit === 'acres' ? (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-secondary block mb-1">Min Acres</label>
                            <input type="number" placeholder="e.g. 5" value={filterLotSizeMin} onChange={e => setFilterLotSizeMin(e.target.value)}
                              className="w-full border border-outline-variant/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-secondary block mb-1">Max Acres</label>
                            <input type="number" placeholder="e.g. 500" value={filterLotSizeMax} onChange={e => setFilterLotSizeMax(e.target.value)}
                              className="w-full border border-outline-variant/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-secondary block mb-1">Min Sq Ft</label>
                            <input type="number" placeholder="e.g. 5000" value={filterSqFtMin} onChange={e => setFilterSqFtMin(e.target.value)}
                              className="w-full border border-outline-variant/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-secondary block mb-1">Max Sq Ft</label>
                            <input type="number" placeholder="e.g. 50000" value={filterSqFtMax} onChange={e => setFilterSqFtMax(e.target.value)}
                              className="w-full border border-outline-variant/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Zoning */}
                    <div>
                      <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Zoning Type</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[['agricultural', 'Agricultural'], ['recreational', 'Recreational'], ['residential', 'Residential'], ['commercial', 'Commercial'], ['mixed', 'Mixed Use'], ['unrestricted', 'Unrestricted']].map(([val, label]) => (
                          <button key={val} onClick={() => toggleMultiFilter(setFilterZoning, val)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                              filterZoning.includes(val) ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-outline-variant/25 text-on-surface hover:border-primary/30'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${filterZoning.includes(val) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                              {filterZoning.includes(val) && <span className="material-symbols-outlined text-white" style={{fontSize:'10px'}}>check</span>}
                            </span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Utilities */}
                    <div>
                      <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Utilities Access</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['Water', 'Electric', 'Gas', 'Septic', 'Sewer'].map(val => (
                          <button key={val} onClick={() => toggleMultiFilter(setFilterUtilities, val)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                              filterUtilities.includes(val) ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-outline-variant/25 text-on-surface hover:border-primary/30'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${filterUtilities.includes(val) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                              {filterUtilities.includes(val) && <span className="material-symbols-outlined text-white" style={{fontSize:'10px'}}>check</span>}
                            </span>
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Road Access */}
                    <div>
                      <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">Road Access</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['Paved Road', 'Gravel Road', 'Dirt Road', 'Private Road', 'Easement', 'No Road Access'].map(val => (
                          <button key={val} onClick={() => toggleMultiFilter(setFilterRoadAccessProps, val)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                              filterRoadAccessProps.includes(val) ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-outline-variant/25 text-on-surface hover:border-primary/30'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${filterRoadAccessProps.includes(val) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                              {filterRoadAccessProps.includes(val) && <span className="material-symbols-outlined text-white" style={{fontSize:'10px'}}>check</span>}
                            </span>
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                  <div className="px-5 py-4 border-t border-outline-variant/10 sticky bottom-0 bg-white flex gap-3">
                    <button
                      onClick={() => { setFilterLotSizeMin(''); setFilterLotSizeMax(''); setFilterSqFtMin(''); setFilterSqFtMax(''); setFilterZoning([]); setFilterUtilities([]); setFilterRoadAccessProps([]); }}
                      className="flex-1 border border-outline-variant/30 text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilterDrawer(false)}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-12 gap-8 mb-12">
              <div className="col-span-12 hidden md:flex flex-wrap items-center gap-4 py-6 border-y border-outline-variant/20">
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

            {listingsLoading ? (
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
                <p className="font-headline text-xl font-bold text-primary mb-2">{showMyListings ? 'No listings created yet' : 'No listings found'}</p>
                <p className="text-sm">{showMyListings ? 'Create your first listing to see it here.' : 'Try a different search term'}</p>
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
                  const isHighlighted = hoveredListingId === listing.id;
                  return (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      ref={(el: HTMLAnchorElement | null) => { if (el) cardRefs.current.set(listing.id, el); else cardRefs.current.delete(listing.id); }}
                      onMouseEnter={() => setHoveredListingId(listing.id)}
                      onMouseLeave={() => setHoveredListingId(null)}
                      className={`flex flex-col group rounded-2xl overflow-hidden border bg-white transition-all ${
                        isHighlighted
                          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                          : 'border-outline-variant/15 hover:shadow-lg hover:border-outline-variant/30'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative overflow-hidden bg-surface-container-low aspect-video">
                        {(showMyListings || (listing.promoted && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date())) && (
                          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
                            {showMyListings && (() => {
                              const statusMeta = getListingStatusMeta(listing.status);
                              return (
                                <span className={`${statusMeta.className} text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg`}>
                                  {statusMeta.label}
                                </span>
                              );
                            })()}
                            {listing.promoted && listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date() && (
                              <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                Featured
                              </span>
                            )}
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
          onClick={handleCreateListing}
          className="bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform ring-4 ring-white/10"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        </button>
      </div>
    </div>
  );
}
