'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import LockedFeature from '@/components/LockedFeature';
import ListingLimitBanner from '@/components/ListingLimitBanner';
import UpgradeModal from '@/components/UpgradeModal';
import { usePermissions } from '@/hooks/usePermissions';

const LISTINGS = [
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

function SellerContact({ seller }: { seller: typeof LISTINGS[0]['seller'] }) {
  return (
    <div className="pt-3 mt-3 border-t border-surface-container">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Listed By</p>
      <p className="text-sm font-bold text-primary mb-1">{seller.name}</p>
      <div className="space-y-0.5">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">mail</span>{seller.email}
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">phone</span>{seller.phone}
        </p>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { tier, loading, listingsThisPeriod, listingStatus } = usePermissions();
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const canViewContact = !loading && (tier === 'priority' || tier === 'exclusive');

  function handleCreateListing() {
    if (listingStatus === 'blocked') {
      setShowBlockedModal(true);
    } else {
      // TODO: navigate to create listing flow
    }
  }

  return (
    <div className="bg-surface text-on-surface">
      <Header />

      {showBlockedModal && (
        <UpgradeModal
          featureName="Unlimited Listings"
          requiredTier="priority"
          onDismiss={() => setShowBlockedModal(false)}
        />
      )}

      <main className="pt-24 px-10 pb-20 min-h-screen max-w-[1400px] mx-auto">
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
            <button className="px-6 py-2 bg-surface-container-lowest shadow-sm rounded-lg text-sm font-bold text-primary">Grid</button>
            <button className="px-6 py-2 text-slate-500 text-sm font-medium hover:text-primary transition-colors">Map View</button>
          </div>
        </section>

        {/* Listing limit banner for standard tier */}
        {!loading && tier === 'standard' && listingsThisPeriod >= 2 && (
          <div className="mb-6">
            <ListingLimitBanner listingsUsed={listingsThisPeriod} tier="standard" />
          </div>
        )}

        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 flex flex-wrap items-center gap-4 py-6 border-y border-outline-variant/20">
            {['Acreage Range', 'Zoning Type', 'Utilities Access', 'Soil Composition'].map(filter => (
              <div key={filter} className="group relative">
                <button className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary">
                  {filter}
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By:</span>
              <select className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer">
                <option>Newest First</option>
                <option>Price: High to Low</option>
                <option>Acreage: Largest</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {LISTINGS.map(listing => (
            <div key={listing.id} className="flex flex-col group">
              <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={listing.imgAlt}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  src={listing.img}
                />
                {listing.promoted && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                      Promoted
                    </span>
                  </div>
                )}
                {listing.badge?.position === 'top-right' && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{listing.badge.label}</span>
                  </div>
                )}
                {listing.badge?.position === 'bottom-left' && (
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary/90 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{listing.badge.label}</span>
                  </div>
                )}
                {!listing.promoted && !listing.badge && (
                  <div className="absolute top-4 right-4">
                    <button className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm text-primary hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">favorite</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="px-2 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-black text-primary">{listing.title}</h3>
                  <span className="text-3xl font-black text-primary">{listing.price}</span>
                </div>
                <p className="text-slate-500 text-sm mb-4">{listing.location} • {listing.acreage}</p>
                <div className="flex flex-wrap gap-2 mb-auto">
                  {listing.tags.map(tag => (
                    <span key={tag} className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{tag}</span>
                  ))}
                </div>

                {/* Seller contact — locked for standard */}
                {canViewContact ? (
                  <SellerContact seller={listing.seller} />
                ) : (
                  <LockedFeature
                    requiredTier="priority"
                    message="Upgrade to Priority to contact this seller"
                    className="rounded-xl mt-3"
                  >
                    <SellerContact seller={listing.seller} />
                  </LockedFeature>
                )}
              </div>
            </div>
          ))}
        </div>
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

      {/* FAB — blocked for standard tier at limit */}
      <div className="fixed bottom-10 right-10 z-[60]">
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
