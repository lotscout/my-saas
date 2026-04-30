import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { createServiceClient } from '@/lib/supabase/service';

interface SellerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Listing {
  id: string;
  title: string | null;
  state: string | null;
  county: string | null;
  lot_size_acres: number | null;
  lot_size_sqft: number | null;
  asking_price: number | null;
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price on request';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price.toLocaleString()}`;
}

function formatSize(acres: number | null, sqft: number | null): string {
  if (acres) return `${acres.toLocaleString()} acres`;
  if (sqft) return `${sqft.toLocaleString()} sq ft`;
  return 'Size not listed';
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [profileResult, listingsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, bio, avatar_url, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('listings')
      .select('id, title, state, county, lot_size_acres, lot_size_sqft, asking_price')
      .eq('user_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ]);

  if (profileResult.error || !profileResult.data) {
    notFound();
  }

  const profile = profileResult.data as SellerProfile;
  const listings = (listingsResult.data ?? []) as Listing[];
  const displayName = profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Anonymous';
  const initials = getInitials(profile.first_name, profile.last_name);
  const bio = profile.bio || 'Active land wholesaler on LotScout';

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-8 max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/10">
                  <span className="text-primary font-black text-3xl">{initials}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                <h1 className="font-headline text-3xl font-black text-primary">{displayName}</h1>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest self-center sm:self-auto">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Wholesaler
                </span>
              </div>
              <p className="text-secondary text-sm mb-3">
                Member since {formatMemberSince(profile.created_at)}
              </p>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-prose">{bio}</p>
            </div>

            {/* Contact Button */}
            <div className="shrink-0">
              <Link
                href={`/messaging?to=${id}`}
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                Contact {profile.first_name || displayName}
              </Link>
            </div>
          </div>
        </div>

        {/* Active Listings */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline text-2xl font-black text-primary">Active Listings</h2>
            <span className="text-secondary text-sm font-medium">
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            </span>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-outline-variant/20 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-primary/20 mb-4 block">landscape</span>
              <p className="font-headline text-lg font-bold text-primary mb-1">No active listings at this time</p>
              <p className="text-secondary text-sm">Check back later for new properties from this seller.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-outline-variant/20 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
                >
                  <div>
                    <h3 className="font-headline font-black text-primary text-lg leading-tight mb-1">
                      {listing.title || 'Untitled Property'}
                    </h3>
                    {(listing.county || listing.state) && (
                      <p className="text-secondary text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {[listing.county, listing.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-sm text-secondary">landscape</span>
                      {formatSize(listing.lot_size_acres, listing.lot_size_sqft)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-primary/8 px-3 py-1.5 rounded-lg text-primary font-black">
                      <span className="material-symbols-outlined text-sm">payments</span>
                      {formatPrice(listing.asking_price)}
                    </span>
                  </div>

                  <div className="mt-auto pt-2">
                    <Link
                      href="/marketplace"
                      className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                    >
                      View Listing
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="w-full py-16 px-8 bg-primary grid grid-cols-1 md:grid-cols-2 items-center gap-8 z-10 relative">
        <div className="space-y-6">
          <div className="text-emerald-50 font-black text-2xl tracking-tighter flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="LotScout Logo" className="h-10 w-10 object-contain invert brightness-0" src="/logo.png" />
            LotScout
          </div>
          <p className="font-['Inter'] text-xs tracking-wide uppercase text-emerald-200/60 max-w-sm leading-relaxed">
            Advanced Geospatial Land Management Systems. Precision in every boundary.
          </p>
          <div className="text-emerald-200/40 font-['Inter'] text-[10px] uppercase tracking-widest">© 2024 LotScout. All rights reserved.</div>
        </div>
        <div className="flex flex-wrap md:justify-end gap-x-10 gap-y-4 font-['Inter'] text-xs tracking-widest uppercase font-bold">
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Terms of Service</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Privacy Policy</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
