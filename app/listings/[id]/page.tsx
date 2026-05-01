'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserTier } from '@/hooks/useUserTier';

interface Listing {
  id: string;
  user_id: string;
  status: string;
  ownership_type: string | null;
  title: string | null;
  property_description: string | null;
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
  price_negotiable: boolean | null;
  preferred_close_date: string | null;
  contact_methods: string[] | null;
  photos_urls: string[] | null;
  seller_first_name: string | null;
  seller_last_name: string | null;
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

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerContact, setSellerContact] = useState<SellerContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { tier, isAdmin, loading: tierLoading } = useUserTier();

  useEffect(() => {
    if (!id) return;
    (async () => {
      // Use service-role API route to bypass RLS for published listings
      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const data = await res.json() as Listing;
      if (!data || !data.id) { setNotFound(true); setLoading(false); return; }
      setListing(data as Listing);

      // Only fetch seller contact info for non-test listings with real contact methods
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
  }, [id]);

  function handleMessage() {
    if (tierLoading) return;
    if (!tier && !isAdmin) { setShowUpgradeModal(true); return; }
    router.push(`/messaging?recipient=${listing?.user_id}`);
  }

  if (loading) {
    return (
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-8 flex items-center justify-center min-h-[60vh]">
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

  const sellerName = [listing.seller_first_name, listing.seller_last_name].filter(Boolean).join(' ') || 'Seller';

  const pricePerAcre =
    listing.lot_size_unit === 'acres' && listing.lot_size_acres && listing.asking_price
      ? Math.round(listing.asking_price / listing.lot_size_acres)
      : null;

  const lotSizeDisplay = listing.lot_size_acres
    ? `${listing.lot_size_acres.toLocaleString()} Acres`
    : listing.lot_size_sqft
    ? `${listing.lot_size_sqft.toLocaleString()} sq ft`
    : null;

  const isMessagingOnly =
    listing.is_test_listing === true ||
    !listing.contact_methods?.length ||
    listing.contact_methods.every(m => m === 'LotScout Messaging');

  const contactMethods = isMessagingOnly ? [] : (listing.contact_methods ?? []).filter(m => m !== 'LotScout Messaging');
  const hasEmail = contactMethods.some(m => m.toLowerCase().includes('email'));
  const hasPhone = contactMethods.some(m => m.toLowerCase().includes('phone') && !m.toLowerCase().includes('text'));
  const hasText  = contactMethods.some(m => m.toLowerCase().includes('text') || m.toLowerCase().includes('sms'));

  return (
    <div className="bg-surface text-on-surface">
      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Message Sellers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Direct seller messaging requires a paid LotScout account. Choose a plan to connect with active sellers.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">
                View Plans →
              </Link>
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-6">

        {/* Header */}
        <header className="bg-surface-container-lowest rounded-xl p-8 mb-10 shadow-sm border border-outline-variant/15">
          <div className="flex flex-col gap-6">
            <Link href="/marketplace" className="flex items-center gap-2 text-secondary font-medium text-sm hover:text-primary transition-colors w-fit">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Marketplace
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-primary mb-2">
                  {listing.title || 'Untitled Listing'}
                </h1>
                <p className="text-secondary font-body">
                  Seller:{' '}
                  <Link href={`/sellers/${listing.user_id}`} className="text-primary font-semibold hover:underline">
                    {sellerName}
                  </Link>
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full capitalize">
                    {listing.status?.replace('_', ' ') ?? 'Active'}
                  </span>
                  {listing.ownership_type && (
                    <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-xs font-bold rounded-full">
                      {listing.ownership_type}
                    </span>
                  )}
                  {listing.price_negotiable && (
                    <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold rounded-full">
                      Price Negotiable
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left md:text-right flex-shrink-0">
                <div className="text-4xl font-extrabold font-headline text-primary-container">
                  {fmtPrice(listing.asking_price)}
                </div>
                {pricePerAcre !== null && (
                  <div className="text-secondary font-semibold text-lg">~{fmtPrice(pricePerAcre)} / acre</div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Two column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left column */}
          <div className="lg:col-span-8 space-y-10">

            {/* Property Details */}
            <section className="bg-surface rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">map</span>
                <h2 className="text-xl font-bold font-headline text-primary">Property Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 p-1 bg-surface-container-low rounded-xl border border-outline-variant/10">
                {lotSizeDisplay && (
                  <div className="p-4 bg-surface-container-lowest rounded-lg">
                    <label className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Lot Size</label>
                    <div className="text-on-surface font-semibold">{lotSizeDisplay}</div>
                  </div>
                )}
                {listing.zoning && (
                  <div className="p-4 bg-surface-container-lowest rounded-lg">
                    <label className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Zoning</label>
                    <div className="text-on-surface font-semibold">{listing.zoning}</div>
                  </div>
                )}
                {(listing.road_access?.length ?? 0) > 0 && (
                  <div className="p-4 bg-surface-container-lowest rounded-lg">
                    <label className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Road Access</label>
                    <div className="text-on-surface font-semibold">{listing.road_access!.join(', ')}</div>
                  </div>
                )}
                {listing.preferred_close_date && (
                  <div className="p-4 bg-surface-container-lowest rounded-lg">
                    <label className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Preferred Close Date</label>
                    <div className="text-on-surface font-semibold">{fmtCloseDate(listing.preferred_close_date)}</div>
                  </div>
                )}
                {(listing.utilities?.length ?? 0) > 0 && (
                  <div className="p-4 bg-surface-container-lowest rounded-lg">
                    <label className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Utilities</label>
                    <div className="text-on-surface font-semibold">{listing.utilities!.join(', ')}</div>
                  </div>
                )}
                {listing.apn && (
                  <div className="p-4 bg-surface-container-lowest rounded-lg">
                    <label className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">APN</label>
                    <div className="text-on-surface font-semibold">{listing.apn}</div>
                  </div>
                )}
              </div>
            </section>

            {/* Location */}
            <section className="bg-surface rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">location_on</span>
                <h2 className="text-xl font-bold font-headline text-primary">Location</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-outline mb-1">State</span>
                  <span className="text-on-surface font-medium">{listing.state || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-outline mb-1">County</span>
                  <span className="text-on-surface font-medium">{listing.county || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-outline mb-1">Zip Code</span>
                  <span className="text-on-surface font-medium">{listing.zip_code || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-outline mb-1">Street Address</span>
                  <span className="text-on-surface font-medium">{listing.street_address || 'Undisclosed Address'}</span>
                </div>
              </div>
            </section>

            {/* Description */}
            {listing.property_description && (
              <section className="bg-surface rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">article</span>
                  <h2 className="text-xl font-bold font-headline text-primary">Property Description</h2>
                </div>
                <div className="text-secondary leading-relaxed font-body whitespace-pre-line">
                  {listing.property_description}
                </div>
              </section>
            )}

            {/* Photos */}
            <section className="bg-surface rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">photo_library</span>
                <h2 className="text-xl font-bold font-headline text-primary">Photos</h2>
              </div>
              {listing.photos_urls?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listing.photos_urls.map((url, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Property photo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-surface-container-high border border-outline-variant/15 flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-5xl text-outline/30">photo_camera</span>
                  <p className="text-sm text-outline/60 font-medium">No photos provided for this listing</p>
                </div>
              )}
            </section>

          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">

            {/* CTA Card */}
            <div className="bg-primary-container text-white rounded-xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold font-headline mb-6">Interested in this property?</h3>

              <button
                onClick={handleMessage}
                className="w-full py-4 bg-white text-primary-container font-bold rounded-lg hover:bg-emerald-50 transition-colors shadow-lg active:scale-95"
              >
                Message Seller
              </button>

              {isMessagingOnly && (
                <div className="flex items-center justify-center gap-2 mt-4 text-on-primary-container text-xs font-medium uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  LotScout Messaging Only
                </div>
              )}

              <div className="my-6 border-t border-white/10" />

              <div>
                <div className="font-bold text-lg font-headline">{sellerName}</div>
                <Link
                  href={`/sellers/${listing.user_id}`}
                  className="text-on-primary-container hover:text-white text-sm font-medium transition-colors"
                >
                  View seller profile
                </Link>
              </div>
            </div>

            {/* Listing Information */}
            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/15 shadow-sm">
              <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-6">Listing Information</h4>
              <ul className="space-y-4">
                <li className="flex justify-between items-center border-b border-surface-container-high pb-4">
                  <span className="text-secondary text-sm">Listed by</span>
                  <span className="font-semibold text-primary text-sm">{sellerName}</span>
                </li>
                <li className="flex justify-between items-center border-b border-surface-container-high pb-4">
                  <span className="text-secondary text-sm">Listing Date</span>
                  <span className="font-semibold text-primary text-sm">{fmtListingDate(listing.created_at)}</span>
                </li>
                <li className="flex justify-between items-center border-b border-surface-container-high pb-4">
                  <span className="text-secondary text-sm">Status</span>
                  <span className="font-semibold text-primary text-sm capitalize">{listing.ownership_type || '—'}</span>
                </li>

                {/* Contact methods (non-messaging-only listings) */}
                {!isMessagingOnly && (
                  <>
                    {hasEmail && sellerContact?.email && (
                      <li className="flex items-center justify-between border-b border-surface-container-high pb-4">
                        <span className="text-secondary text-sm">Email</span>
                        <a
                          href={`mailto:${sellerContact.email}`}
                          className="flex items-center gap-1.5 font-semibold text-primary text-sm hover:underline"
                        >
                          <span className="material-symbols-outlined text-base">mail</span>
                          {sellerContact.email}
                        </a>
                      </li>
                    )}
                    {hasPhone && sellerContact?.phone && (
                      <li className="flex items-center justify-between border-b border-surface-container-high pb-4">
                        <span className="text-secondary text-sm">Phone</span>
                        <a
                          href={`tel:${sellerContact.phone}`}
                          className="flex items-center gap-1.5 font-semibold text-primary text-sm hover:underline"
                        >
                          <span className="material-symbols-outlined text-base">call</span>
                          {sellerContact.phone}
                        </a>
                      </li>
                    )}
                    {hasText && sellerContact?.phone && (
                      <li className="flex items-center justify-between">
                        <span className="text-secondary text-sm">Text / SMS</span>
                        <a
                          href={`sms:${sellerContact.phone}`}
                          className="flex items-center gap-1.5 font-semibold text-primary text-sm hover:underline"
                        >
                          <span className="material-symbols-outlined text-base">sms</span>
                          {sellerContact.phone}
                        </a>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
