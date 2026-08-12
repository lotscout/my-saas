'use client';

import { useEffect, useRef, type AnchorHTMLAttributes } from 'react';

function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props}>{children}</a>;
}

// Full feature list shown in every pricing card. Features not included in a
// tier are dimmed (opacity-40) with a dash instead of a green check.
const ALL_FEATURES: { name: string; standard: boolean; priority: boolean; exclusive: boolean }[] = [
  { name: 'Unlimited Scout AI Search',                       standard: true,  priority: true,  exclusive: true  },
  { name: 'Land Marketplace Access',                         standard: true,  priority: true,  exclusive: true  },
  { name: 'Lot to Buyer Match AI',                           standard: true,  priority: true,  exclusive: true  },
  { name: 'Custom Company Profile',                          standard: true,  priority: true,  exclusive: true  },
  { name: 'Buyer Directory Access',                          standard: true,  priority: true,  exclusive: true  },
  { name: 'Property Analysis Reports',                       standard: true,  priority: true,  exclusive: true  },
  { name: 'Lot Analysis Reports',                            standard: true,  priority: true,  exclusive: true  },
  { name: 'Unlimited Listings',                              standard: false, priority: true,  exclusive: true  },
  { name: 'Promoted Lot Requests',                           standard: false, priority: true,  exclusive: true  },
  { name: 'Financing Partners Access',                       standard: false, priority: true,  exclusive: true  },
  { name: '24/7 Support',                                    standard: false, priority: true,  exclusive: true  },
  { name: 'Dedicated Full-Time Account Manager',             standard: false, priority: false, exclusive: true  },
  { name: 'Early Access to New Listings',                    standard: false, priority: false, exclusive: true  },
  { name: 'Early Access to New Buyers',                      standard: false, priority: false, exclusive: true  },
  { name: 'Hands-On Listing Support and Deal Guidance',      standard: false, priority: false, exclusive: true  },
  { name: 'White-Glove Onboarding and Setup',                standard: false, priority: false, exclusive: true  },
];

function PlanFeatures({ tier }: { tier: 'standard' | 'priority' | 'exclusive' }) {
  return (
    <ul className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 flex-grow">
      {ALL_FEATURES.map((f) => {
        const included = f[tier];
        return (
          <li
            key={f.name}
            className={`flex items-start gap-2 text-sm sm:text-lg ${included ? 'text-on-surface' : 'text-secondary opacity-40'}`}
          >
            {included ? (
              <span className="inline-flex items-center justify-center rounded-full flex-none mt-1" style={{ backgroundColor: '#1D9E75', width: '18px', height: '18px' }}>
                <span className="material-symbols-outlined text-white" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>check</span>
              </span>
            ) : (
              <span className="material-symbols-outlined text-base flex-none mt-1 text-secondary">remove</span>
            )}
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
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing) {
          if (existing.dataset.loaded === 'true') { resolve(); return; }
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
          s.dataset.loaded = 'true';
          resolve();
        };
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

      await new Promise(requestAnimationFrame);
      if (cancelled || !containerRef.current) return;

      const w = containerRef.current.clientWidth || 360;
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
          <Link href="/home" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lotscout-logo.png" alt="LotScout" className="w-11 h-11 object-contain" />
            <span className="font-headline text-[1.625rem] font-extrabold text-primary tracking-tight">LotScout</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">

          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/sign-in" className="px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg border border-primary/30 text-primary text-[10px] sm:text-sm font-bold hover:bg-primary/5 transition-colors whitespace-nowrap leading-none">Sign In</Link>
            <Link href="/sign-up" className="px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg bg-[#1D9E75] text-white text-[10px] sm:text-sm font-bold hover:bg-[#16845F] transition-colors whitespace-nowrap leading-none">Sign Up</Link>
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
            <div className="text-center md:text-left">
              <h1 className="font-headline text-2xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
                America&apos;s #1 Platform for Off-Market Land Deals.
              </h1>
              <p className="font-body text-base sm:text-lg text-on-primary-container leading-relaxed mb-6 md:mb-8 max-w-2xl mx-auto md:mx-0">
                <span className="md:hidden">Buy, sell, and discover off-market land deals across the U.S.</span>
                <span className="hidden md:inline">LotScout connects serious land buyers and sellers directly, without the MLS or commissions. Join today and save thousands on your next land deal.</span>
              </p>
              <div className="md:hidden mb-8 max-w-sm mx-auto">
                <HeroMap />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center md:justify-start">
                <Link href="/sign-up" className="w-full sm:w-auto text-center bg-[#1D9E75] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#16845F] transition-colors shadow-lg">Find Your Next Deal</Link>
                <Link href="/sign-up" className="w-full sm:w-auto text-center border-2 border-[#1D9E75] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#1D9E75]/15 transition-colors">List Your Property</Link>
              </div>
            </div>
            {/* Right column: interactive map */}
            <div className="hidden md:block">
              <HeroMap />
            </div>
          </div>
        </div>
      </header>



      {/* SECTION 2: Social Proof Stats */}
      <section className="py-8 sm:py-16 bg-[#1D9E75] text-white px-4 sm:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 sm:gap-8">
          {[
            { stat: '$4.51M', label: 'Commission Saved' },
            { stat: '$77M+',  label: 'Land Transactions' },
            { stat: '905+',   label: 'Active Listings' },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center px-2 py-3 sm:p-8 bg-white/5 rounded-xl sm:rounded-2xl">
              <div className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-1 sm:mb-2 text-primary-fixed leading-none">{stat}</div>
              <div className="text-on-primary-container font-medium uppercase tracking-wide sm:tracking-widest text-[9px] sm:text-xs leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Marketplace Preview */}
      <section id="marketplace" className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary tracking-tight mb-4">Vacant Land for Sale — No Leads, Just Deals</h2>
          <p className="text-secondary text-base sm:text-xl mb-8 sm:mb-10">All properties on LotScout are off-market listings you won&apos;t find on Zillow or Realtor.com.</p>
        </div>

        {/* Auto-scrolling carousel */}
        <div className="overflow-hidden">
          <div
            className="flex gap-5 w-max"
            style={{ animation: 'marquee 40s linear infinite' }}
            onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
            onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
          >
            {[
              { price: '$50,000',    meta: '5.48 Acres · Wheelersburg, OH', tags: ['Residential', 'Wooded'],      img: '/listing-wheelersburg-oh.jpg' },
              { price: '$725,000',   meta: '120 Acres · Boerne, TX',        tags: ['Ranch', 'Fenced'],            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBY8GRIcD8bfludLFbbSK2-UO4kPxRWkltV05YcwfOfumwBuFit8qogzpUo5R7jRl3nmg2D5nktA3OIz3-o0AD1PgdOydScI-4fGpEyeyJ8LYrP6vidGCO93e4R6bVb7kradtCFRd6aNDuWKsDYyBUafliElyzavFiss21NsffAFE3tqx0X2aCa0odAjaGbQmYyLaJoTDI0gkNAyHs-hXwnliG7GDBEVW1lLcX-A1eyBkIXamMLLI2KKL4PQIsp_-ovx_kWI1K7N--F' },
              { price: '$29,000',    meta: '3 Acres · Clyde, TX',             tags: ['Ranch', 'Agricultural'],     img: '/listing-clyde-tx.jpg' },
              { price: '$300,000',   meta: '0.69 Acres · Bend, OR',          tags: ['Riverfront', 'Wooded'],      img: '/listing-bend-or.jpg' },
              { price: '$2,800,000', meta: '540 Acres · Steamboat, CO',     tags: ['Agricultural', 'Water Rights'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASYXdtkI0pKaN4KHtgDbkNT4ZERJxlztUPHz5d65poQKRw0NjABePxTimTG-cz6LtOqkMXF-zzzwIaFrDkQEjT3wpbPzQAqNdK5QDMK4hIsz_ZWIscZ2C7HZTU7c1-2DhI6xurbxtghY2ob8gvCuxAhZZZ2lemxdpTf1InVz8Rz76JP84Ayuq3weQvP6_7e0sJ9nDVSvGnoVQ3PAqqL2s7GgUfZB-FvUUUdqnKBEgBI0WRlQrkzy6L_Q7MnR6kre3Ba0NqtSvnD08l' },
              { price: '$450,000',   meta: '65 Acres · Gallatin, MT',       tags: ['Residential', 'Riverfront'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZulao6-fdPwv2dF4rCmpLxldDqaxwyGM1jAI60S0PXAiHvKusydmS7WFNrGZnWz3agwBLEApnoku9sp4EhNNceAoxGd5ZAXvNqqIxw-XJ0nhfC3zdwh_V9x6pN9qZWr0BfWBjulUvndtIDYgvMZa37uL5q7oOrlugcGuGU5t2sqHuoYcX-JGE7QGNvU1zStdrQrsrxV8hg5RdvZbdYEDWLxsiJu8QEujvbw5qsxRUfLnHmarvBynQs-vYnKjlgYG4a8Kb38v0LWdV' },
            // Duplicate for seamless loop
              { price: '$50,000',    meta: '5.48 Acres · Wheelersburg, OH', tags: ['Residential', 'Wooded'],      img: '/listing-wheelersburg-oh.jpg' },
              { price: '$725,000',   meta: '120 Acres · Boerne, TX',        tags: ['Ranch', 'Fenced'],            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBY8GRIcD8bfludLFbbSK2-UO4kPxRWkltV05YcwfOfumwBuFit8qogzpUo5R7jRl3nmg2D5nktA3OIz3-o0AD1PgdOydScI-4fGpEyeyJ8LYrP6vidGCO93e4R6bVb7kradtCFRd6aNDuWKsDYyBUafliElyzavFiss21NsffAFE3tqx0X2aCa0odAjaGbQmYyLaJoTDI0gkNAyHs-hXwnliG7GDBEVW1lLcX-A1eyBkIXamMLLI2KKL4PQIsp_-ovx_kWI1K7N--F' },
              { price: '$29,000',    meta: '3 Acres · Clyde, TX',             tags: ['Ranch', 'Agricultural'],     img: '/listing-clyde-tx.jpg' },
              { price: '$300,000',   meta: '0.69 Acres · Bend, OR',          tags: ['Riverfront', 'Wooded'],      img: '/listing-bend-or.jpg' },
              { price: '$2,800,000', meta: '540 Acres · Steamboat, CO',     tags: ['Agricultural', 'Water Rights'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASYXdtkI0pKaN4KHtgDbkNT4ZERJxlztUPHz5d65poQKRw0NjABePxTimTG-cz6LtOqkMXF-zzzwIaFrDkQEjT3wpbPzQAqNdK5QDMK4hIsz_ZWIscZ2C7HZTU7c1-2DhI6xurbxtghY2ob8gvCuxAhZZZ2lemxdpTf1InVz8Rz76JP84Ayuq3weQvP6_7e0sJ9nDVSvGnoVQ3PAqqL2s7GgUfZB-FvUUUdqnKBEgBI0WRlQrkzy6L_Q7MnR6kre3Ba0NqtSvnD08l' },
              { price: '$450,000',   meta: '65 Acres · Gallatin, MT',       tags: ['Residential', 'Riverfront'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZulao6-fdPwv2dF4rCmpLxldDqaxwyGM1jAI60S0PXAiHvKusydmS7WFNrGZnWz3agwBLEApnoku9sp4EhNNceAoxGd5ZAXvNqqIxw-XJ0nhfC3zdwh_V9x6pN9qZWr0BfWBjulUvndtIDYgvMZa37uL5q7oOrlugcGuGU5t2sqHuoYcX-JGE7QGNvU1zStdrQrsrxV8hg5RdvZbdYEDWLxsiJu8QEujvbw5qsxRUfLnHmarvBynQs-vYnKjlgYG4a8Kb38v0LWdV' },
            ].map((listing, i) => (
              <div key={i} className="w-72 flex-none bg-white rounded-xl overflow-hidden shadow-sm border border-surface-container-high">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-full h-48 object-cover" alt={listing.meta} src={listing.img} />
                <div className="p-5">
                  <div className="text-primary font-bold text-lg mb-1">{listing.price}</div>
                  <div className="text-secondary font-medium text-sm mb-0.5">{listing.meta.split(' · ')[0]}</div>
                  <div className="text-secondary/70 text-xs">{listing.meta.split(' · ')[1] ?? ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 flex justify-center">
          <Link href="/sign-up" className="bg-[#1D9E75] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform">Get Started</Link>
        </div>
      </section>

      {/* SECTION 4: Be Seen by Active Buyers */}
      <section className="py-16 bg-surface-container-low px-4 sm:px-8">
        <div className="max-w-7xl mx-auto mb-8 sm:mb-10">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary tracking-tight">Be Seen by Active Buyers</h2>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-5 w-max"
            style={{ animation: 'marquee 40s linear infinite' }}
            onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
            onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
          >
            {[
              { name: 'Vanguard Land Trust', location: 'Denver, CO', budget: '$500k to $2M', zoning: 'Agricultural' },
              { name: 'BuildWorks Inc.', location: 'Austin, TX', budget: '$200k to $800k', zoning: 'Residential' },
              { name: 'Meridian Land Holdings', location: 'Seattle, WA', budget: '$1M to $5M', zoning: 'Commercial' },
              { name: 'Summit Acre Partners', location: 'Boise, ID', budget: '$350k to $1.5M', zoning: 'Residential' },
              { name: 'Ironwood Development', location: 'Phoenix, AZ', budget: '$750k to $3M', zoning: 'Industrial' },
              { name: 'Prairie Capital Group', location: 'Tulsa, OK', budget: '$400k to $2.5M', zoning: 'Agricultural' },
              { name: 'Harbor Ridge Builders', location: 'Charlotte, NC', budget: '$600k to $3M', zoning: 'Residential' },
              { name: 'Keystone Industrial Sites', location: 'Columbus, OH', budget: '$1.2M to $6M', zoning: 'Industrial' },
              // Duplicate for seamless loop
              { name: 'Vanguard Land Trust', location: 'Denver, CO', budget: '$500k to $2M', zoning: 'Agricultural' },
              { name: 'BuildWorks Inc.', location: 'Austin, TX', budget: '$200k to $800k', zoning: 'Residential' },
              { name: 'Meridian Land Holdings', location: 'Seattle, WA', budget: '$1M to $5M', zoning: 'Commercial' },
              { name: 'Summit Acre Partners', location: 'Boise, ID', budget: '$350k to $1.5M', zoning: 'Residential' },
              { name: 'Ironwood Development', location: 'Phoenix, AZ', budget: '$750k to $3M', zoning: 'Industrial' },
              { name: 'Prairie Capital Group', location: 'Tulsa, OK', budget: '$400k to $2.5M', zoning: 'Agricultural' },
              { name: 'Harbor Ridge Builders', location: 'Charlotte, NC', budget: '$600k to $3M', zoning: 'Residential' },
              { name: 'Keystone Industrial Sites', location: 'Columbus, OH', budget: '$1.2M to $6M', zoning: 'Industrial' },
            ].map((buyer, i) => (
              <div key={i} className="w-72 flex-none bg-white rounded-xl p-5 shadow-sm border border-surface-container-high min-h-[280px] flex flex-col text-left">
                <div className="flex items-center justify-start mb-5">
                  <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                  </span>
                </div>
                <h3 className="font-headline font-extrabold text-primary text-lg leading-tight mb-4">{buyer.name}</h3>
                <div className="space-y-3 text-sm flex-grow w-full">
                  <p className="text-on-surface-variant leading-relaxed">
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-secondary/60 mb-0.5">Actively buying in</span>
                    <span className="font-bold text-on-surface">{buyer.location}</span>
                  </p>
                  <p className="text-on-surface-variant leading-relaxed">
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-secondary/60 mb-0.5">Budget</span>
                    <span className="font-bold text-on-surface">{buyer.budget}</span>
                  </p>
                  <p className="text-on-surface-variant leading-relaxed">
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-secondary/60 mb-0.5">Zoning</span>
                    <span className="font-bold text-on-surface">{buyer.zoning}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 flex justify-center">
          <Link href="/sign-up" className="bg-[#1D9E75] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform">See More Buyers</Link>
        </div>
      </section>

      {/* SECTION: Scout Search */}
      <section className="py-20 bg-primary px-4 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-headline text-3xl sm:text-5xl font-bold text-white mb-4">Scout Search</h2>
          <p className="text-on-primary-container text-lg mb-10">Analyze your deals, learn your market, price your property, all with Scout.</p>
          <Link href="/sign-up" className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 min-h-[64px] shadow-2xl hover:shadow-none transition-shadow cursor-pointer w-full">
            <span className="material-symbols-outlined text-primary text-2xl">search</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              'How do I add value to my property?',
              'Buyers in my area',
              'Where should I invest in land?',
            ].map((q) => (
              <Link key={q} href="/sign-up" className="text-white/70 hover:text-white text-xs border border-white/20 hover:border-white/50 px-3 py-1.5 rounded-full transition-colors">
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: Market Updates */}
      <section className="py-16 bg-surface-container-low px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 sm:mb-10 text-center">
            <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary tracking-tight mb-2">Market Updates</h2>
            <p className="text-secondary text-base sm:text-lg max-w-2xl mx-auto">Get ahead of the competition by knowing your market.</p>
            <Link href="/sign-up" className="mt-4 inline-flex text-sm font-bold text-primary hover:underline items-center gap-1">
              View all updates <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                tag: 'Colorado',
                tagColor: 'bg-emerald-100 text-emerald-700',
                title: 'Denver Fringe Markets Heating Up',
                body: 'Permit activity along the E-470 corridor surged 34% QoQ. Ag-zoned parcels within 15 miles of DIA are moving faster than any time in the past 3 years.',
                date: 'Aug 2026',
                icon: 'trending_up',
              },
              {
                tag: 'Texas',
                tagColor: 'bg-amber-100 text-amber-700',
                title: 'West Texas Ranch Land Seeing Renewed Interest',
                body: 'Low supply and increased buyer demand from out-of-state investors is pushing $/acre up in the Abilene–Clyde corridor. Off-market deals closing 18% above asking.',
                date: 'Aug 2026',
                icon: 'landscape',
              },
              {
                tag: 'National',
                tagColor: 'bg-blue-100 text-blue-700',
                title: 'Off-Market Land Deals Outpace MLS Volume',
                body: 'For the third consecutive quarter, off-market land transactions outpaced MLS-listed deals by 2.1x in rural and semi-rural markets under 500 acres.',
                date: 'Jul 2026',
                icon: 'bar_chart',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-surface-container-high shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${item.tagColor}`}>{item.tag}</span>
                  <div className="w-9 h-9 bg-primary/5 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-primary text-base mb-2">{item.title}</h3>
                  <p className="text-secondary text-sm leading-relaxed">{item.body}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-surface-container-high">
                  <span className="text-xs text-secondary/60 font-medium">{item.date}</span>
                  <Link href="/sign-up" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                    Read more <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Pricing */}
      <section id="pricing" className="py-16 bg-surface px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary mb-8 sm:mb-10 text-center tracking-tight">Simple, Transparent Pricing.</h2>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:snap-none md:pb-0">
            {/* Standard */}
            <div className="w-[86vw] max-w-sm flex-none snap-center bg-white p-5 sm:p-8 rounded-2xl flex flex-col shadow-sm border border-surface-container-high md:w-auto md:max-w-none md:flex-auto">
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Standard</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$129</span>
                <span className="text-secondary">/mo</span>
              </div>
              <PlanFeatures tier="standard" />
              <Link href="/sign-up" className="w-full py-4 rounded-xl border-2 border-[#1D9E75] text-[#1D9E75] font-bold hover:bg-[#1D9E75]/10 transition-colors text-center block">Get Started</Link>
            </div>
            {/* Priority */}
            <div className="w-[86vw] max-w-sm flex-none snap-center bg-white p-5 sm:p-8 rounded-2xl flex flex-col shadow-xl border-2 border-primary relative mt-4 md:mt-0 md:w-auto md:max-w-none md:flex-auto">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1D9E75] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Most Popular</div>
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Priority</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$249</span>
                <span className="text-secondary">/mo</span>
              </div>
              <PlanFeatures tier="priority" />
              <Link href="/sign-up" className="w-full py-4 rounded-xl bg-[#1D9E75] text-white font-bold hover:shadow-lg transition-all text-center block">Get Started</Link>
            </div>
            {/* Exclusive */}
            <div className="w-[86vw] max-w-sm flex-none snap-center bg-white p-5 sm:p-8 rounded-2xl flex flex-col shadow-sm border border-surface-container-high md:w-auto md:max-w-none md:flex-auto">
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Exclusive</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$599</span>
                <span className="text-secondary">/mo</span>
              </div>
              <PlanFeatures tier="exclusive" />
              <Link href="/sign-up" className="w-full py-4 rounded-xl border-2 border-[#1D9E75] text-[#1D9E75] font-bold hover:bg-[#1D9E75]/10 transition-colors text-center block">Get Started</Link>
            </div>
          </div>
          <p className="mt-8 sm:mt-10 text-center text-secondary text-base sm:text-lg">
            Exclusive: Looking for something else related to land development, market updates, or economic data? Contact us at{' '}
            <a href="mailto:support@lotscout.com" className="font-semibold text-emerald-600 hover:underline">support@lotscout.com</a>
          </p>

        </div>
      </section>

      {/* SECTION 8: Final CTA */}
      <section className="py-16 bg-primary px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-headline text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Your Next Land Deal Starts Here</h2>
          <p className="text-on-primary-container text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            LotScout connects serious buyers and sellers of off-market land directly. No realtors. No commission. No waiting on the MLS. Just the right match at the right time.
          </p>
          <Link href="/sign-up" className="inline-block bg-[#1D9E75] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#16845F] transition-colors active:scale-95 text-center">Get Started Free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 w-full py-12 px-4 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8 font-body text-sm tracking-normal">
          <div className="text-xl font-bold text-emerald-50">LotScout</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="/terms">Terms of Service</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="/privacy">Privacy Policy</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="mailto:support@lotscout.com?subject=Cookie%20settings">Cookie Settings</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="mailto:support@lotscout.com?subject=Contact%20sales">Contact Sales</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="/data-sources">Data Sources</a>
          </div>
          <div className="text-emerald-300/70">© 2026 LotScout Technologies. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
