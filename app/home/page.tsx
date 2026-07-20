'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import CreateListingGate from '@/components/CreateListingGate';

// Full feature list shown in every pricing card. Features not included in a
// tier are dimmed (opacity-40) with a dash instead of a green check.
const ALL_FEATURES: { name: string; standard: boolean; priority: boolean; enterprise: boolean }[] = [
  { name: 'Unlimited Scout AI Search',                       standard: true,  priority: true,  enterprise: true  },
  { name: 'Land Marketplace Access',                         standard: true,  priority: true,  enterprise: true  },
  { name: 'Lot to Buyer Match AI',                           standard: true,  priority: true,  enterprise: true  },
  { name: 'Custom Company Profile',                          standard: true,  priority: true,  enterprise: true  },
  { name: 'Buyer Directory Access',                          standard: true,  priority: true,  enterprise: true  },
  { name: 'Property Analysis Reports',                       standard: true,  priority: true,  enterprise: true  },
  { name: 'Lot Analysis Reports',                            standard: true,  priority: true,  enterprise: true  },
  { name: 'Unlimited Listings',                              standard: false, priority: true,  enterprise: true  },
  { name: 'Promoted Lot Requests',                           standard: false, priority: true,  enterprise: true  },
  { name: 'Financing Partners Access',                       standard: false, priority: true,  enterprise: true  },
  { name: '24/7 Support',                                    standard: false, priority: true,  enterprise: true  },
  { name: 'Dedicated Full-Time Account Manager',             standard: false, priority: false, enterprise: true  },
  { name: 'Early Access to New Listings Before Anyone Else', standard: false, priority: false, enterprise: true  },
  { name: 'Early Access to New Buyers Before Anyone Else',   standard: false, priority: false, enterprise: true  },
  { name: 'Hands-On Listing Support and Deal Guidance',      standard: false, priority: false, enterprise: true  },
  { name: 'White-Glove Onboarding and Setup',                standard: false, priority: false, enterprise: true  },
];

function PlanFeatures({ tier }: { tier: 'standard' | 'priority' | 'enterprise' }) {
  return (
    <ul className="space-y-2 mb-8 flex-grow">
      {ALL_FEATURES.map((f) => {
        const included = f[tier];
        return (
          <li
            key={f.name}
            className={`flex items-start gap-2 text-lg ${included ? 'text-on-surface' : 'text-secondary opacity-40'}`}
          >
            <span className={`material-symbols-outlined text-base flex-none mt-1 ${included ? 'text-primary' : 'text-secondary'}`}>
              {included ? 'check' : 'remove'}
            </span>
            {f.name}
          </li>
        );
      })}
    </ul>
  );
}


const HERO_SELLERS = [
  { city: 'Austin, TX',         lat: 30.27,  lng: -97.74,   count: 24 },
  { city: 'Denver, CO',         lat: 39.74,  lng: -104.98,  count: 18 },
  { city: 'Nashville, TN',      lat: 36.17,  lng: -86.78,   count: 15 },
  { city: 'Charlotte, NC',      lat: 35.23,  lng: -80.84,   count: 22 },
  { city: 'Phoenix, AZ',        lat: 33.45,  lng: -112.07,  count: 19 },
  { city: 'Boise, ID',          lat: 43.61,  lng: -116.20,  count: 11 },
  { city: 'Fort Myers, FL',     lat: 26.64,  lng: -81.87,   count: 17 },
  { city: 'Raleigh, NC',        lat: 35.78,  lng: -78.64,   count: 13 },
  { city: 'Kansas City, MO',    lat: 39.10,  lng: -94.58,   count: 9  },
  { city: 'Atlanta, GA',        lat: 33.75,  lng: -84.39,   count: 21 },
  { city: 'Dallas, TX',         lat: 32.78,  lng: -96.80,   count: 28 },
  { city: 'Salt Lake City, UT', lat: 40.76,  lng: -111.89,  count: 14 },
  { city: 'Billings, MT',       lat: 45.78,  lng: -108.50,  count: 8  },
  { city: 'Tulsa, OK',          lat: 36.15,  lng: -95.99,   count: 10 },
  { city: 'Columbia, SC',       lat: 34.00,  lng: -81.03,   count: 12 },
  { city: 'Albuquerque, NM',    lat: 35.08,  lng: -106.65,  count: 9  },
  { city: 'Sacramento, CA',     lat: 38.58,  lng: -121.49,  count: 16 },
  { city: 'Memphis, TN',        lat: 35.15,  lng: -90.05,   count: 11 },
  { city: 'Lubbock, TX',        lat: 33.58,  lng: -101.85,  count: 8  },
  { city: 'Knoxville, TN',      lat: 35.96,  lng: -83.92,   count: 10 },
  { city: 'Fargo, ND',          lat: 46.88,  lng: -96.79,   count: 7  },
  { city: 'Wichita, KS',        lat: 37.69,  lng: -97.34,   count: 12 },
];

const HERO_BUYERS = [
  { city: 'Seattle, WA',        lat: 47.61,  lng: -122.33,  count: 31 },
  { city: 'Chicago, IL',        lat: 41.88,  lng: -87.63,   count: 27 },
  { city: 'New York, NY',       lat: 40.71,  lng: -74.01,   count: 35 },
  { city: 'Los Angeles, CA',    lat: 34.05,  lng: -118.24,  count: 29 },
  { city: 'Houston, TX',        lat: 29.76,  lng: -95.37,   count: 33 },
  { city: 'Minneapolis, MN',    lat: 44.98,  lng: -93.27,   count: 18 },
  { city: 'Columbus, OH',       lat: 39.96,  lng: -82.99,   count: 16 },
  { city: 'Portland, OR',       lat: 45.52,  lng: -122.68,  count: 22 },
  { city: 'San Francisco, CA',  lat: 37.77,  lng: -122.42,  count: 24 },
  { city: 'Boston, MA',         lat: 42.36,  lng: -71.06,   count: 19 },
  { city: 'Miami, FL',          lat: 25.77,  lng: -80.19,   count: 26 },
  { city: 'Indianapolis, IN',   lat: 39.77,  lng: -86.16,   count: 14 },
  { city: 'Louisville, KY',     lat: 38.25,  lng: -85.76,   count: 12 },
  { city: 'Richmond, VA',       lat: 37.54,  lng: -77.44,   count: 15 },
  { city: 'Tampa, FL',          lat: 27.95,  lng: -82.46,   count: 20 },
  { city: 'Pittsburgh, PA',     lat: 40.44,  lng: -79.99,   count: 13 },
  { city: 'Detroit, MI',        lat: 42.33,  lng: -83.05,   count: 17 },
  { city: 'Oklahoma City, OK',  lat: 35.47,  lng: -97.52,   count: 11 },
  { city: 'San Antonio, TX',    lat: 29.42,  lng: -98.49,   count: 23 },
  { city: 'San Diego, CA',      lat: 32.72,  lng: -117.16,  count: 20 },
  { city: 'Las Vegas, NV',      lat: 36.17,  lng: -115.14,  count: 18 },
  { city: 'Omaha, NE',          lat: 41.26,  lng: -95.94,   count: 13 },
];

function HeroMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });

    let cancelled = false;

    (async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js');
      if (cancelled || !svgRef.current || !containerRef.current) return;

      const res = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const us: any = await res.json();
      if (cancelled || !svgRef.current || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d3 = (window as any).d3;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topojson = (window as any).topojson;

      const w = containerRef.current.clientWidth;
      const h = Math.round(w * 0.64);

      const svg = d3.select(svgRef.current).attr('width', w).attr('height', h);
      svg.selectAll('*').remove();

      const statesFeature = topojson.feature(us, us.objects.states);
      const projection = d3.geoAlbersUsa().fitSize([w, h], statesFeature);
      const path = d3.geoPath().projection(projection);

      svg.selectAll('path.state')
        .data(statesFeature.features)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', '#e8ede9')
        .attr('stroke', '#c1c8c2')
        .attr('stroke-width', 0.5);

      const tooltip = tooltipRef.current;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plotDots = (data: typeof HERO_SELLERS, color: string) => {
        data.forEach(({ city, lat, lng, count }) => {
          const coords = projection([lng, lat]);
          if (!coords) return;
          const r = 4 + Math.sqrt(count) * 0.8;
          svg.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', r)
            .attr('fill', color)
            .attr('fill-opacity', 0.85)
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('mouseover', (_event: any) => {
              if (!tooltip) return;
              tooltip.style.display = 'block';
              tooltip.textContent = `${city}: ${count} active`;
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('mousemove', (event: any) => {
              if (!tooltip || !containerRef.current) return;
              const rect = containerRef.current.getBoundingClientRect();
              tooltip.style.left = `${event.clientX - rect.left + 10}px`;
              tooltip.style.top = `${event.clientY - rect.top - 36}px`;
            })
            .on('mouseout', () => {
              if (!tooltip) return;
              tooltip.style.display = 'none';
            });
        });
      };

      plotDots(HERO_SELLERS, '#1b4332');
      plotDots(HERO_BUYERS, '#86af99');
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="w-full rounded-xl overflow-hidden" />
      <div
        ref={tooltipRef}
        className="absolute hidden z-50 bg-white/95 text-primary text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none border border-outline-variant/20 whitespace-nowrap"
      />
      <div className="flex items-center gap-6 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1b4332]" />
          <span className="text-xs font-semibold text-on-primary-container/80">Seller active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#86af99]" />
          <span className="text-xs font-semibold text-on-primary-container/80">Buyer active</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-fixed selection:text-primary">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-surface-container-high">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/home" className="font-headline text-xl font-extrabold text-primary tracking-tight">LotScout</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/home#platform" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">Platform</Link>
            <Link href="/home#marketplace" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">Marketplace</Link>
            <Link href="/home#pricing" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-bold hover:bg-primary/5 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: Hero */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-20 bg-primary-container relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-fixed-dim rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid md:grid-cols-[3fr_2fr] gap-10 items-center">
            {/* Left column: hero text */}
            <div>
              <h1 className="font-headline text-3xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
                America&apos;s #1 Platform for Off-Market Land Deals.
              </h1>
              <p className="font-body text-lg text-on-primary-container leading-relaxed mb-8 max-w-2xl">
                LotScout connects serious land buyers and sellers directly, without the MLS or commissions. Join today and save thousands on your next land deal.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/sign-up" className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-low transition-colors shadow-lg">Find Your Next Deal</Link>
                <Link href="/sign-up" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">List Your Property</Link>
              </div>
            </div>
            {/* Right column: interactive map */}
            <div className="hidden md:block">
              <HeroMap />
            </div>
          </div>
        </div>
      </header>

      {/* Off-market callout banner */}
      <div className="bg-emerald-900 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="material-symbols-outlined text-emerald-300 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
          <p className="text-white font-semibold text-base">
            All listings on LotScout are off-market. Sell without a realtor and keep 100% of your proceeds.
          </p>
        </div>
      </div>

      {/* SECTION 2: Social Proof Stats */}
      <section className="py-16 bg-primary text-white px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { stat: '92%',     label: 'Fast Closing Rate' },
            { stat: '$4.32M',  label: 'Commission Saved' },
            { stat: '72M+',    label: 'Land Transactions' },
            { stat: '2,400+',  label: 'Active Listings' },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center p-6 bg-white/5 rounded-2xl">
              <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1 text-primary-fixed">{stat}</div>
              <div className="text-on-primary-container font-medium uppercase tracking-widest text-xs">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Marketplace Preview */}
      <section className="py-16 bg-surface px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary tracking-tight mb-4">A Glimpse of What&apos;s Inside</h2>
          <p className="text-secondary text-base sm:text-xl mb-8 sm:mb-12">All properties on LotScout are off-market listings you won&apos;t find on Zillow or Realtor.com.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-48 object-cover" alt="aerial landscape of a vast green rolling hill pasture during sunset" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZulao6-fdPwv2dF4rCmpLxldDqaxwyGM1jAI60S0PXAiHvKusydmS7WFNrGZnWz3agwBLEApnoku9sp4EhNNceAoxGd5ZAXvNqqIxw-XJ0nhfC3zdwh_V9x6pN9qZWr0BfWBjulUvndtIDYgvMZa37uL5q7oOrlugcGuGU5t2sqHuoYcX-JGE7QGNvU1zStdrQrsrxV8hg5RdvZbdYEDWLxsiJu8QEujvbw5qsxRUfLnHmarvBynQs-vYnKjlgYG4a8Kb38v0LWdV" />
              <div className="p-6">
                <div className="text-primary font-bold text-xl mb-1">$450,000</div>
                <div className="text-secondary font-medium mb-4">65 Acres · Gallatin, MT</div>
                <div className="flex gap-2">
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Residential</span>
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Riverfront</span>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-48 object-cover" alt="dramatic mountain peaks with pine forest in foreground under a clear blue alpine sky" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzc__lHoSAdcSO8AzlHGngmhLFyyJKdxCymOUePJ02ntLt232Z_VO7rydLpCKr3Ezbptxnz_wcY32esEgXuSDNnaiSAX3VdMQD4sWtRChsyBqACGwQ1LGvOerOjXc1NmpIpODR8q8Y-gZ-MvvQTk8J6iv3Jao-5TCJcKCA_Um0U2P2p3a-cQnxGZSqnLj3iKD779Sa4Zo4BagWKtSNbNoiEaB8DlChHVCmUFeYuYH9m6d9RgcqCTaCv1vqLNh59sO0yOfhmKsw8abG" />
              <div className="p-6">
                <div className="text-primary font-bold text-xl mb-1">$1,200,000</div>
                <div className="text-secondary font-medium mb-4">210 Acres · Bend, OR</div>
                <div className="flex gap-2">
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Timber</span>
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Off-Grid</span>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-48 object-cover" alt="wide open flat ranch land with golden grass and scattered oak trees" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY8GRIcD8bfludLFbbSK2-UO4kPxRWkltV05YcwfOfumwBuFit8qogzpUo5R7jRl3nmg2D5nktA3OIz3-o0AD1PgdOydScI-4fGpEyeyJ8LYrP6vidGCO93e4R6bVb7kradtCFRd6aNDuWKsDYyBUafliElyzavFiss21NsffAFE3tqx0X2aCa0odAjaGbQmYyLaJoTDI0gkNAyHs-hXwnliG7GDBEVW1lLcX-A1eyBkIXamMLLI2KKL4PQIsp_-ovx_kWI1K7N--F" />
              <div className="p-6">
                <div className="text-primary font-bold text-xl mb-1">$725,000</div>
                <div className="text-secondary font-medium mb-4">120 Acres · Boerne, TX</div>
                <div className="flex gap-2">
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Ranch</span>
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Fenced</span>
                </div>
              </div>
            </div>
            {/* Card 4 - locked */}
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high group">
              <div
                className="blur-md grayscale opacity-50 h-full w-full absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuASYXdtkI0pKaN4KHtgDbkNT4ZERJxlztUPHz5d65poQKRw0NjABePxTimTG-cz6LtOqkMXF-zzzwIaFrDkQEjT3wpbPzQAqNdK5QDMK4hIsz_ZWIscZ2C7HZTU7c1-2DhI6xurbxtghY2ob8gvCuxAhZZZ2lemxdpTf1InVz8Rz76JP84Ayuq3weQvP6_7e0sJ9nDVSvGnoVQ3PAqqL2s7GgUfZB-FvUUUdqnKBEgBI0WRlQrkzy6L_Q7MnR6kre3Ba0NqtSvnD08l')" }}
              />
              <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full text-center bg-white/20 backdrop-blur-[2px]">
                <span className="material-symbols-outlined text-primary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <p className="font-headline font-bold text-primary mb-6">Sign up to unlock 2,400+ off-market listings</p>
                <Link href="/sign-up" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform">Get Started</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: New Buyers Added Daily */}
      <section className="py-16 bg-surface-container-low px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary tracking-tight mb-3">New Buyers Added Daily</h2>
          <p className="text-secondary text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl">
            Sellers — these buyers are actively searching for land like yours right now.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Buyer Card 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-container-high flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-none">
                  <span className="material-symbols-outlined text-primary text-2xl">corporate_fare</span>
                </div>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                </span>
              </div>
              <h3 className="font-headline font-extrabold text-primary text-lg leading-tight mb-0.5">Vanguard Land Trust</h3>
              <p className="text-secondary text-sm font-medium mb-4">Denver, CO</p>
              <div className="space-y-2 text-sm flex-grow">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">crop_square</span>
                  <span>50 to 500 acres</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">payments</span>
                  <span>$500k to $2M budget</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">nature</span>
                  <span>Agricultural / Conservation</span>
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">View Profile</button>
            </div>

            {/* Buyer Card 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-container-high flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-none">
                  <span className="material-symbols-outlined text-primary text-2xl">construction</span>
                </div>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                </span>
              </div>
              <h3 className="font-headline font-extrabold text-primary text-lg leading-tight mb-0.5">BuildWorks Inc.</h3>
              <p className="text-secondary text-sm font-medium mb-4">Austin, TX</p>
              <div className="space-y-2 text-sm flex-grow">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">crop_square</span>
                  <span>5 to 20 acres</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">payments</span>
                  <span>$200k to $800k budget</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">home_work</span>
                  <span>Light Industrial / Residential</span>
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">View Profile</button>
            </div>

            {/* Buyer Card 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-container-high flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-none">
                  <span className="material-symbols-outlined text-primary text-2xl">forest</span>
                </div>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                </span>
              </div>
              <h3 className="font-headline font-extrabold text-primary text-lg leading-tight mb-0.5">Meridian Land Holdings</h3>
              <p className="text-secondary text-sm font-medium mb-4">Seattle, WA</p>
              <div className="space-y-2 text-sm flex-grow">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">crop_square</span>
                  <span>100 to 1,000 acres</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">payments</span>
                  <span>$1M to $5M budget</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">park</span>
                  <span>Timberland / Recreational</span>
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">View Profile</button>
            </div>

            {/* Card 4 - locked */}
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              <div className="blur-sm opacity-40 absolute inset-0 p-6 space-y-4 pointer-events-none">
                <div className="w-12 h-12 bg-primary/10 rounded-full"></div>
                <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
                <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-surface-container-high rounded w-full"></div>
                  <div className="h-3 bg-surface-container-high rounded w-5/6"></div>
                  <div className="h-3 bg-surface-container-high rounded w-4/5"></div>
                </div>
              </div>
              <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full text-center min-h-[280px]">
                <span className="material-symbols-outlined text-primary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <p className="font-headline font-bold text-primary mb-6 leading-snug">Sign up to see all active buyers</p>
                <Link href="/sign-up" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform">Get Started</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Who It's For */}
      <section className="py-16 bg-surface-container-low px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary tracking-tight mb-3">Built for Both Sides of the Deal</h2>
            <p className="text-secondary text-base sm:text-lg max-w-2xl">Whether you are liquidating an asset or expanding your portfolio, we provide the infrastructure to move faster.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-3xl">
            {/* Seller */}
            <div className="bg-primary p-8 md:p-10 flex flex-col justify-between">
              <div>
                <h3 className="font-headline text-2xl font-bold text-white mb-4">I&apos;m a Seller</h3>
                <p className="text-on-primary-container text-lg mb-6">Reach a curated network of institutional and private buyers ready to deploy capital immediately.</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Priority listing exposure',
                    'Direct-to-buyer messaging',
                    'Automated land valuation',
                    'Identity verification for buyers',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/90 font-medium">
                      <span className="material-symbols-outlined text-primary-fixed-dim">check</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <CreateListingGate className="w-full bg-primary-fixed text-primary py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors text-center block">List My Property</CreateListingGate>
            </div>
            {/* Buyer */}
            <div className="bg-white p-8 md:p-10 flex flex-col justify-between">
              <div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">I&apos;m a Buyer</h3>
                <p className="text-secondary text-lg mb-6">Gain access to off-market inventory and deep-data insights before the general public sees the listing.</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Off-market land opportunities',
                    'AI topographic assessments',
                    'Custom search alert criteria',
                    'Direct-to-seller negotiations',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-primary">check</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/sign-up" className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors text-center block">Find Land Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: Pricing */}
      <section className="py-16 bg-surface px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary mb-8 sm:mb-10 text-center tracking-tight">Simple, Transparent Pricing. No Hidden Fees.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Standard */}
            <div className="bg-white p-8 rounded-2xl flex flex-col shadow-sm border border-surface-container-high">
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Standard</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$97</span>
                <span className="text-secondary">/mo</span>
              </div>
              <PlanFeatures tier="standard" />
              <Link href="/sign-up" className="w-full py-4 rounded-xl border-2 border-primary-fixed text-primary font-bold hover:bg-primary-fixed/10 transition-colors text-center block">Get Started</Link>
            </div>
            {/* Priority */}
            <div className="bg-white p-8 rounded-2xl flex flex-col shadow-xl border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Most Popular</div>
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Priority</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$199</span>
                <span className="text-secondary">/mo</span>
              </div>
              <PlanFeatures tier="priority" />
              <Link href="/sign-up" className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all text-center block">Get Started</Link>
            </div>
            {/* Exclusive */}
            <div className="bg-white p-8 rounded-2xl flex flex-col shadow-sm border border-surface-container-high">
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$529</span>
                <span className="text-secondary">/mo</span>
              </div>
              <PlanFeatures tier="enterprise" />
              <Link href="/sign-up" className="w-full py-4 rounded-xl border-2 border-primary-fixed text-primary font-bold hover:bg-primary-fixed/10 transition-colors text-center block">Get Started</Link>
            </div>
          </div>
          <p className="mt-8 sm:mt-10 text-center text-secondary text-base sm:text-lg">
            Enterprise: Looking for something else related to land development, market updates, or economic data? Contact us at{' '}
            <a href="mailto:support@lotscout.com" className="font-semibold text-emerald-600 hover:underline">support@lotscout.com</a>
          </p>

        </div>
      </section>

      {/* SECTION 8: Final CTA */}
      <section className="py-16 bg-primary px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-headline text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Your Next Land Partnership Starts Here</h2>
          <p className="text-on-primary-container text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            LotScout connects serious buyers and sellers of off-market land directly. No realtors. No commission. No waiting on the MLS. Just the right match at the right time.
          </p>
          <Link href="/sign-up" className="inline-block bg-white text-primary px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:bg-surface-container-low transition-colors active:scale-95">Get Started Free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 w-full py-12 px-8">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8 font-body text-sm tracking-normal">
          <div className="text-xl font-bold text-emerald-50">LotScout</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Terms of Service</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Cookie Settings</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Contact Sales</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Data Sources</a>
          </div>
          <div className="text-emerald-300/70">© 2026 LotScout Technologies. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
