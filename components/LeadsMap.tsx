'use client';

import { useEffect, useRef, useState } from 'react';
import COUNTY_CENTROIDS from '@/lib/county-centroids.json';
import type { PropertyLead } from '@/lib/mockPropertyLeads';

const centroids = COUNTY_CENTROIDS as unknown as Record<string, [number, number]>;

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

function formatPrice(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function coordsForLead(lead: PropertyLead, index: number): [number, number] | null {
  const countyKey = `${lead.county}|${lead.state}`;
  const base = centroids[countyKey] ?? STATE_CENTROIDS[lead.state];
  if (!base) return null;
  const angle = index * 2.399963;
  const radius = 0.08 + (index % 5) * 0.018;
  return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

export default function LeadsMap({ leads, onPinClick }: { leads: PropertyLead[]; onPinClick?: (id: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapUnlocked, setMapUnlocked] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const onPinClickRef = useRef(onPinClick);
  useEffect(() => { onPinClickRef.current = onPinClick; });

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    import('leaflet').then(async L => {
      if (cancelled) return;
      await import('leaflet/dist/leaflet.css');
      if (cancelled) return;

      if (!mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        mapInstanceRef.current = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
        }).setView([39.5, -98.35], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      leads.forEach((lead, index) => {
        const coords = coordsForLead(lead, index);
        if (!coords) return;
        const icon = L.divIcon({
          className: '',
          html: '<div style="background:#F59E0B;width:13px;height:13px;border-radius:50%;border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.4);"></div>',
          iconSize: [13, 13],
          iconAnchor: [6.5, 6.5],
        });
        const popup = L.popup({ maxWidth: 240 }).setContent(`
          <div style="font-family:system-ui,sans-serif;padding:2px 0;">
            <div style="display:inline-block;font-size:9px;font-weight:800;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:99px;text-transform:uppercase;margin-bottom:5px;">Lead</div>
            <div style="font-weight:800;font-size:13px;color:#0f2d1f;margin-bottom:4px;line-height:1.3;">${lead.title}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${lead.city}, ${lead.state} · ${lead.lotSize}</div>
            <div style="font-size:15px;font-weight:900;color:#D97706;margin-bottom:8px;">${formatPrice(lead.price)}</div>
            <a href="/leads/${lead.id}" style="display:block;text-align:center;background:#D97706;color:white;font-size:11px;font-weight:800;padding:6px 12px;border-radius:8px;text-decoration:none;">View Lead →</a>
          </div>
        `);
        const marker = L.marker(coords, { icon }).bindPopup(popup);
        marker.on('click', () => onPinClickRef.current?.(lead.id));
        marker.addTo(map);
        markersRef.current.push(marker);
      });
    });

    return () => { cancelled = true; };
  }, [leads]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const toggle = (handler: { enable?: () => void; disable?: () => void } | undefined, enabled: boolean) => {
      if (enabled) handler?.enable?.(); else handler?.disable?.();
    };
    toggle(map.dragging, mapUnlocked);
    toggle(map.touchZoom, mapUnlocked);
    toggle(map.doubleClickZoom, mapUnlocked);
    toggle(map.boxZoom, mapUnlocked);
    toggle(map.keyboard, mapUnlocked);
    map.scrollWheelZoom?.disable?.();
  }, [mapUnlocked]);

  useEffect(() => () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-emerald-900/15 bg-surface-container-low">
      <div ref={mapRef} className="h-full w-full" />
      <button
        type="button"
        onClick={() => setMapUnlocked(v => !v)}
        className="absolute right-4 top-4 z-[1000] flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow backdrop-blur-sm"
      >
        <span className="material-symbols-outlined text-base">{mapUnlocked ? 'lock_open' : 'lock'}</span>
        {mapUnlocked ? 'Map unlocked' : 'Move map'}
      </button>
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-white bg-[#F59E0B] shadow" />
          Leads
        </span>
        <span className="text-slate-400">{leads.length} shown</span>
      </div>
    </div>
  );
}
