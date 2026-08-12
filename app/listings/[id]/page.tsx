'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserTier } from '@/hooks/useUserTier';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import SendMessageModal from '@/components/SendMessageModal';
import { getSellerName, isBadName } from '@/lib/getSellerName';
import COUNTY_CENTROIDS from '@/lib/county-centroids.json';

const IMAGE_REQUEST_BODY =
  "Hi, I'm interested in this property and would like to request additional images. Thank you!";

const STATE_NAMES_TO_ABBREV: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA',
  michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
};

function normalizeStateForMap(state: string | null): string | null {
  const value = state?.trim();
  if (!value) return null;
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  return STATE_NAMES_TO_ABBREV[value.toLowerCase()] ?? null;
}

function normalizeCountyForMap(county: string | null): string | null {
  const value = county?.trim();
  if (!value) return null;
  return value.replace(/\s+County$/i, '').trim();
}

const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [32.7990, -86.8073], AK: [64.2008, -153.4937], AZ: [34.2744, -111.6602],
  AR: [34.8938, -92.4426], CA: [37.1841, -119.4696], CO: [38.9972, -105.5478],
  CT: [41.6219, -72.7273], DE: [38.9896, -75.5050], FL: [28.6305, -82.4497],
  GA: [32.6415, -83.4426], HI: [20.2927, -156.3737], ID: [44.3509, -114.6130],
  IL: [40.0417, -89.1965], IN: [39.8942, -86.2816], IA: [42.0751, -93.4960],
  KS: [38.5266, -96.7265], KY: [37.5347, -85.3021], LA: [31.0689, -91.9968],
  ME: [45.3695, -69.2428], MD: [39.0550, -76.7909], MA: [42.2596, -71.8083],
  MI: [44.3467, -85.4102], MN: [46.2807, -94.3053], MS: [32.7364, -89.6678],
  MO: [38.3566, -92.4580], MT: [46.8797, -110.3626], NE: [41.5378, -99.7951],
  NV: [39.3289, -116.6312], NH: [43.6805, -71.5811], NJ: [40.1907, -74.6728],
  NM: [34.4071, -106.1126], NY: [42.9538, -75.5268], NC: [35.5557, -79.3877],
  ND: [47.4501, -100.4659], OH: [40.2862, -82.7937], OK: [35.5889, -97.4943],
  OR: [43.9336, -120.5583], PA: [40.8781, -77.7996], RI: [41.6762, -71.5562],
  SC: [33.9169, -80.8964], SD: [44.4443, -100.2263], TN: [35.8580, -86.3505],
  TX: [31.4757, -99.3312], UT: [39.3055, -111.0937], VT: [44.0687, -72.6658],
  VA: [37.5215, -78.8537], WA: [47.3826, -120.4472], WV: [38.6409, -80.6227],
  WI: [44.6243, -89.9941], WY: [42.9957, -107.5512], DC: [38.8951, -77.0369],
};

const DESERT_SAMPLE_STATES = new Set(['AZ', 'CA', 'NV', 'NM', 'UT', 'WY']);
const MOUNTAIN_SAMPLE_STATES = new Set(['CO', 'ID', 'MT', 'OR', 'WA']);

function getSampleImageUrl(state: string | null) {
  const stateCode = state?.trim().toUpperCase() || '';
  if (DESERT_SAMPLE_STATES.has(stateCode)) return '/sample-listings/desert-aerial.jpg';
  if (MOUNTAIN_SAMPLE_STATES.has(stateCode)) return '/sample-listings/mountain-aerial.jpg';
  return '/sample-listings/pasture-aerial.jpg';
}

interface Listing {
  id: string;
  user_id: string;
  status: string;
  ownership_type: string | null;
  title: string | null;
  property_description: string | null;
  additional_information: string | null;
  state: string | null;
  county: string | null;
  zip_code: string | null;
  street_address: string | null;
  apn: string | null;
  lot_size_acres: number | null;
  lot_size_sqft: number | null;
  lot_size_unit: string | null;
  zoning: string | null;
  road_access: string[] | null;
  utilities: string[] | null;
  asking_price: number | null;
  comparable_market_value: number | null;
  price_negotiable: boolean | null;
  preferred_close_date: string | null;
  contact_methods: string[] | null;
  photos_urls: string[] | null;
  owner_name: string | null;
  digital_signature: string | null;
  is_test_listing: boolean | null;
  created_at: string;
}

interface SellerContactInfo {
  email: string | null;
  phone: string | null;
}

function fmtPrice(n: number | null): string {
  if (!n) return '—';
  return '$' + n.toLocaleString();
}

function fmtListingDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtCloseDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isPublicSourceMetadata(text: string | null) {
  if (!text) return false;
  return /^(source|imported|scraped)\s*:/i.test(text.trim()) || /facebook|vacant land for sale by owner/i.test(text);
}

function SingleListingMap({ county, state }: { county: string | null; state: string | null }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const centroids = COUNTY_CENTROIDS as unknown as Record<string, [number, number]>;
    const stateCode = normalizeStateForMap(state);
    const countyName = normalizeCountyForMap(county);
    const key = countyName && stateCode ? `${countyName}|${stateCode}` : null;
    let coords: [number, number] | null = null;
    if (key) coords = centroids[key] ?? null;
    if (!coords && stateCode) coords = STATE_CENTROIDS[stateCode] ?? null;
    if (!coords) return;
    const c = coords;

    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapRef.current!).setView(c, county ? 10 : 6);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#1B4332;width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker(c, { icon }).addTo(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [county, state]);

  if (!county && !state) return null;

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden border border-outline-variant/20"
      style={{ height: '300px' }}
    />
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerContact, setSellerContact] = useState<SellerContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [imageRequestSent, setImageRequestSent] = useState(false);
  const [imageRequestLoading, setImageRequestLoading] = useState(false);
  const [alreadyMessaged, setAlreadyMessaged] = useState(false);

  const { tier, isAdmin, loading: tierLoading } = useUserTier();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/sign-in?redirect=/listings/${id}`);
      } else {
        setCurrentUserId(user.id);
        setAuthed(true);
      }
    })();
  }, [id, router]);

  useEffect(() => {
    if (!id || authed !== true) return;
    (async () => {
      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const data = await res.json() as Listing;
      if (!data || !data.id) { setNotFound(true); setLoading(false); return; }
      setListing(data);

      const isMessagingOnly =
        data.is_test_listing === true ||
        !data.contact_methods?.length ||
        (data.contact_methods as string[]).every((m: string) => m === 'LotScout Messaging');

      if (!isMessagingOnly && data.user_id) {
        try {
          const profRes = await fetch(`/api/profiles/${data.user_id}`);
          if (profRes.ok) {
            const prof = await profRes.json();
            if (prof) setSellerContact({ email: prof.email ?? null, phone: prof.phone ?? null });
          }
        } catch { /* no seller contact available */ }
      }

      setLoading(false);
    })();
  }, [id, authed]);

  useEffect(() => {
    if (!listing || !currentUserId) return;
    (async () => {
      const supabase = createClient();
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(buyer_id.eq.${currentUserId},seller_id.eq.${listing.user_id}),` +
          `and(buyer_id.eq.${listing.user_id},seller_id.eq.${currentUserId})`
        )
        .limit(1)
        .maybeSingle();
      if (!conv) return;

      const [{ data: imgMsg }, { data: anyMsg }] = await Promise.all([
        supabase.from('messages').select('id').eq('conversation_id', conv.id).eq('sender_id', currentUserId).eq('body', IMAGE_REQUEST_BODY).maybeSingle(),
        supabase.from('messages').select('id').eq('conversation_id', conv.id).eq('sender_id', currentUserId).limit(1).maybeSingle(),
      ]);

      if (imgMsg) setImageRequestSent(true);
      if (anyMsg) setAlreadyMessaged(true);
    })();
  }, [listing, currentUserId]);

  const photos = listing?.photos_urls ?? [];

  useEffect(() => {
    if (activePhotoIndex >= photos.length) setActivePhotoIndex(0);
  }, [activePhotoIndex, photos.length]);

  function handleMessage() {
    if (tierLoading) return;
    if (!tier && !isAdmin) { setShowUpgradeModal(true); return; }
    setShowMessageModal(true);
  }

  async function handleRequestImages() {
    if (tierLoading) return;
    if (!tier && !isAdmin) { setShowUpgradeModal(true); return; }
    if (imageRequestSent || imageRequestLoading) return;
    setImageRequestLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}/request-images`, { method: 'POST' });
      const data = await res.json();
      if (res.ok || data.alreadySent) {
        setImageRequestSent(true);
        setToastMsg('Image request sent!');
        setTimeout(() => setToastMsg(''), 3000);
      }
    } catch { /* silent */ } finally {
      setImageRequestLoading(false);
    }
  }

  if (authed === null || (authed && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-8 text-center">
        <p className="text-secondary text-lg">Listing not found.</p>
        <Link href="/marketplace" className="mt-4 inline-block text-primary font-semibold hover:underline">
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const sellerName = getSellerName(listing);

  const sellerInitials = (() => {
    const parts = sellerName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'S';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  const pricePerAcre =
    listing.lot_size_acres && listing.asking_price
      ? Math.round(listing.asking_price / listing.lot_size_acres)
      : null;

  const acresDisplay = listing.lot_size_acres
    ? `${listing.lot_size_acres.toLocaleString(undefined, { maximumFractionDigits: 2 })} ac`
    : null;
  const sqftDisplay = listing.lot_size_sqft
    ? `${listing.lot_size_sqft.toLocaleString()} sq ft`
    : null;
  const lotSizeDisplay = [acresDisplay, sqftDisplay].filter(Boolean).join(' / ') || null;

  const isMessagingOnly =
    listing.is_test_listing === true ||
    !listing.contact_methods?.length ||
    listing.contact_methods.every(m => m === 'LotScout Messaging');

  const contactMethods = isMessagingOnly ? [] : (listing.contact_methods ?? []).filter(m => m !== 'LotScout Messaging');
  const hasEmail = contactMethods.some(m => m.toLowerCase().includes('email'));
  const hasPhone = contactMethods.some(m => m.toLowerCase().includes('phone') && !m.toLowerCase().includes('text'));
  const hasText  = contactMethods.some(m => m.toLowerCase().includes('text') || m.toLowerCase().includes('sms'));

  const showPrevPhoto = () => {
    if (photos.length <= 1) return;
    setActivePhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const showNextPhoto = () => {
    if (photos.length <= 1) return;
    setActivePhotoIndex(prev => (prev + 1) % photos.length);
  };

  const countyDisplay = listing.county ? `${listing.county} County` : null;
  const titleLocation = [countyDisplay, listing.state].filter(Boolean).join(', ') || 'Unknown Location';
  const acreageText = listing.lot_size_acres
    ? (listing.lot_size_acres % 1 === 0
        ? listing.lot_size_acres.toLocaleString()
        : listing.lot_size_acres.toLocaleString(undefined, { maximumFractionDigits: 1 }))
    : null;
  const generatedTitle = acreageText ? `${acreageText} Acres in ${titleLocation}` : `Land in ${titleLocation}`;
  const titleSublineBase = [countyDisplay, listing.state].filter(Boolean).join(', ');
  const titleSubline = listing.zip_code ? `${titleSublineBase} ${listing.zip_code}` : titleSublineBase;
  const sampleImageUrl = getSampleImageUrl(listing.state);

  const detailItems: [string, string][] = [
    ...((listing.road_access?.length ?? 0) > 0 ? [['Road Access', listing.road_access!.join(', ')] as [string, string]] : []),
    ...((listing.utilities?.length ?? 0) > 0 ? [['Utilities', listing.utilities!.join(', ')] as [string, string]] : []),
    ...(listing.apn ? [['APN', listing.apn] as [string, string]] : []),
    ...(listing.preferred_close_date ? [['Preferred Close', fmtCloseDate(listing.preferred_close_date)] as [string, string]] : []),
    ...(listing.ownership_type ? [['Ownership', listing.ownership_type] as [string, string]] : []),
    ...(listing.comparable_market_value ? [['Market Value', fmtPrice(listing.comparable_market_value)] as [string, string]] : []),
  ];

  const descriptionParts = [
    listing.property_description || null,
    isPublicSourceMetadata(listing.additional_information) ? null : listing.additional_information || null,
  ].filter(Boolean) as string[];

  const locationItems = [
    ['State', listing.state],
    ['County', listing.county],
    ['Zip Code', listing.zip_code],
    ['Address', listing.street_address],
  ].filter(([, v]) => !!v) as [string, string][];

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Message Sellers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Direct seller messaging requires a paid LotScout account. Choose a plan to connect with active sellers.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-[#1D9E75] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-[#14795A] transition-colors">
                View Plans →
              </Link>
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send message modal */}
      {showMessageModal && currentUserId && listing && (
        <SendMessageModal
          recipientId={listing.user_id}
          recipientName={sellerName}
          currentUserId={currentUserId}
          currentUserIsBuyer={true}
          listingId={listing.id}
          alreadyMessaged={alreadyMessaged}
          onClose={() => setShowMessageModal(false)}
          onSent={() => {
            setShowMessageModal(false);
            setAlreadyMessaged(true);
            setToastMsg('Message sent!');
            setTimeout(() => setToastMsg(''), 3000);
          }}
        />
      )}

      {/* All photos modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="sticky top-0 flex items-center justify-between py-4 bg-black/95 z-10 mb-4">
              <h2 className="text-white text-xl font-bold font-headline">{photos.length} Photos</h2>
              <button
                onClick={() => setShowAllPhotos(false)}
                className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                <span className="material-symbols-outlined text-xl">close</span>
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt={`Property photo ${i + 1}`} className="w-full rounded-lg object-cover" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toastMsg}
        </div>
      )}

      {/* Back button — above gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-3">
        <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Back to Marketplace
        </Link>
      </div>

      {/* Contained listing gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {photos.length > 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-gray-900 shadow-sm">
            <div className="relative overflow-hidden bg-gray-800" style={{ height: 'clamp(280px, 46vh, 520px)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[activePhotoIndex]}
                alt={`Property photo ${activePhotoIndex + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.classList.add('hidden');
                  event.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Sample aerial land image" src={sampleImageUrl} className="h-full w-full object-cover opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#14795A] shadow-sm">
                  Sample image
                </span>
              </div>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevPhoto}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/75 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={showNextPhoto}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/75 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">chevron_right</span>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    {activePhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-gray-900 shadow-sm" style={{ height: 'clamp(240px, 40vh, 380px)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Sample aerial land image" src={sampleImageUrl} className="absolute inset-0 h-full w-full object-cover opacity-85" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#14795A] shadow-sm">
              Sample image
            </span>
            <button
              onClick={handleRequestImages}
              disabled={imageRequestSent || imageRequestLoading || tierLoading}
              className="absolute bottom-4 left-4 px-6 py-2.5 bg-white/95 text-[#14795A] font-semibold rounded-lg hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm"
            >
              {imageRequestSent ? 'Request Sent ✓' : imageRequestLoading ? 'Sending…' : 'Request Images'}
            </button>
          </div>
        )}
      </div>

      {/* Below-gallery content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-6">

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="w-full min-w-0 lg:flex-1 space-y-6">

            {/* Title block */}
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-3xl font-bold text-green-900 leading-tight">
                {generatedTitle}
              </h1>
              {titleSubline && (
                <p className="text-gray-500 text-sm mt-1">{titleSubline}</p>
              )}
            </div>

            {/* Stats bar — Redfin-style horizontal chips */}
            <div className="flex flex-wrap border-y border-outline-variant/30 divide-x divide-outline-variant/30">
              {listing.asking_price != null && listing.asking_price > 0 && (
                <div className="flex flex-col py-4 px-5 flex-1 items-center text-center">
                  <span className="text-xl font-extrabold font-headline text-on-surface leading-none">
                    {fmtPrice(listing.asking_price)}
                  </span>
                  <span className="text-xs text-secondary font-medium mt-1.5">Price</span>
                </div>
              )}
              {lotSizeDisplay && (
                <div className="flex flex-col py-4 px-5 flex-1 items-center text-center">
                  <span className="text-xl font-extrabold font-headline text-on-surface leading-none">
                    {lotSizeDisplay}
                  </span>
                  <span className="text-xs text-secondary font-medium mt-1.5">Lot Size</span>
                </div>
              )}
              {listing.zoning && (
                <div className="flex flex-col py-4 px-5 flex-1 items-center text-center">
                  <span className="text-xl font-extrabold font-headline text-on-surface leading-none">
                    {listing.zoning}
                  </span>
                  <span className="text-xs text-secondary font-medium mt-1.5">Zoning</span>
                </div>
              )}
              {pricePerAcre !== null && (
                <div className="flex flex-col py-4 px-5 flex-1 items-center text-center">
                  <span className="text-xl font-extrabold font-headline text-on-surface leading-none">
                    ~{fmtPrice(pricePerAcre)}
                  </span>
                  <span className="text-xs text-secondary font-medium mt-1.5">/ Acre</span>
                </div>
              )}
            </div>

            {/* About this property */}
            {descriptionParts.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-on-surface mb-3">About this property</h2>
                <div className="text-secondary leading-relaxed space-y-3">
                  {descriptionParts.map((part, i) => (
                    <p key={i} className="whitespace-pre-line">{part}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Property details grid */}
            {detailItems.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-on-surface mb-3">Property details</h2>
                <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {detailItems.map(([label, value], i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-5 py-2 border-b border-outline-variant/15 bg-surface-container-lowest last:border-b-0 ${
                          i % 2 === 1 ? 'md:border-l border-outline-variant/15' : ''
                        }`}
                      >
                        <span className="text-sm text-secondary">{label}</span>
                        <span className="text-sm font-semibold text-on-surface text-right max-w-[55%]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Location with embedded map */}
            <section>
              <h2 className="text-base font-semibold text-on-surface mb-3">Location</h2>
              <SingleListingMap county={listing.county} state={listing.state} />

            </section>

            {/* Direct contact (non-messaging-only listings) */}
            {!isMessagingOnly && (hasEmail || hasPhone || hasText) && sellerContact && (
              <section>
                <h2 className="text-base font-semibold text-on-surface mb-3">Contact seller directly</h2>
                <div className="flex flex-wrap gap-3">
                  {hasEmail && sellerContact.email && (
                    <a
                      href={`mailto:${sellerContact.email}`}
                      className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">mail</span>
                      {sellerContact.email}
                    </a>
                  )}
                  {hasPhone && sellerContact.phone && (
                    <a
                      href={`tel:${sellerContact.phone}`}
                      className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">call</span>
                      {sellerContact.phone}
                    </a>
                  )}
                  {hasText && sellerContact.phone && (
                    <a
                      href={`sms:${sellerContact.phone}`}
                      className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">sms</span>
                      Text: {sellerContact.phone}
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN — sticky sidebar */}
          <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 self-start">
            <div className="lg:sticky lg:top-24 border border-gray-200 rounded-lg shadow-sm p-4 bg-white">

              {/* Seller */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 uppercase tracking-wide">
                  {sellerInitials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-on-surface text-sm truncate">{sellerName}</div>
                  {listing.owner_name && !isBadName(listing.owner_name) && (
                    <Link href={`/sellers/${encodeURIComponent(listing.owner_name)}`} className="text-xs text-primary hover:underline">
                      View seller profile →
                    </Link>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleMessage}
                  className="w-full py-1.5 bg-green-700 text-white font-bold text-[11px] rounded-md hover:bg-green-800 transition-colors active:scale-95"
                >
                  Message Seller
                </button>

                {!tierLoading && (tier || isAdmin) ? (
                  <button
                    onClick={handleRequestImages}
                    disabled={imageRequestSent || imageRequestLoading}
                    className="w-full py-1.5 border border-green-700 text-green-700 font-bold text-[11px] rounded-md hover:bg-green-50 transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {imageRequestSent ? 'Requested ✓' : imageRequestLoading ? 'Sending…' : 'Request Images'}
                  </button>
                ) : !tierLoading ? (
                  <div className="relative group">
                    <button
                      disabled
                      className="w-full py-1.5 border border-green-700/30 text-green-700/40 font-bold text-[11px] rounded-md cursor-not-allowed"
                    >
                      Request Images
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Upgrade to request images
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-outline-variant/15 mt-3 pt-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-secondary">Listed {fmtListingDate(listing.created_at)}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                    listing.status === 'published'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : listing.status === 'under_contract'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-surface-container text-secondary border border-outline-variant/20'
                  }`}>
                    {listing.status?.replace(/_/g, ' ') ?? 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
