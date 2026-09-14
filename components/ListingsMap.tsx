'use client';

import { useEffect, useRef, useState } from 'react';

interface MapListing {
  id: string;
  title: string | null;
  state: string | null;
  county: string | null;
  lot_size_acres: number | null;
  lot_size_sqft: number | null;
  asking_price: number | null;
  zoning: string | null;
  ownership_type: string | null;
  latitude: number;
  longitude: number;
}

interface ListingsMapProps {
  listings: MapListing[];
  filteredIds?: Set<string>;
  highlightedId?: string | null;
  onPinClick?: (id: string) => void;
}

function formatPrice(n: number | null): string {
  if (!n) return 'Price on Request';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}

function formatAcreage(acres: number | null, sqft: number | null): string {
  const acresText = acres ? `${acres.toLocaleString(undefined, { maximumFractionDigits: 2 })} Acres` : '';
  const sqftText = sqft ? `${sqft.toLocaleString()} Sq Ft` : '';
  return [acresText, sqftText].filter(Boolean).join(' / ');
}

export default function ListingsMap({ listings, filteredIds, highlightedId, onPinClick }: ListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapUnlocked, setMapUnlocked] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  // Keep latest callback in a ref so the marker effect doesn't re-run on every render
  const onPinClickRef = useRef(onPinClick);
  useEffect(() => { onPinClickRef.current = onPinClick; });

  // Keep latest filteredIds in a ref so initial marker opacity is correct on first load
  const filteredIdsRef = useRef(filteredIds);
  useEffect(() => { filteredIdsRef.current = filteredIds; });

  // Initialize map once; re-add markers whenever listings change
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    import('leaflet').then(async L => {
      if (cancelled) return;
      await import('leaflet/dist/leaflet.css');
      if (cancelled) return;

      leafletRef.current = L;

      // Create map only once
      if (!mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
        }).setView([39.5, -98.35], 4);
        mapInstanceRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);
      }

      if (cancelled) return;
      const map = mapInstanceRef.current;

      // Clear existing markers before re-adding
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      const makeGreenIcon = () => L.divIcon({
        className: '',
        html: `<div style="background:#1D9E75;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const makeContractIcon = () => L.divIcon({
        className: '',
        html: `<div style="background:#94a3b8;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const plottable = listings.filter(l => l.latitude && l.longitude && l.latitude !== 0 && l.longitude !== 0);

      const currentFilteredIds = filteredIdsRef.current;

      plottable.forEach(listing => {
        const isUnderContract = listing.ownership_type === 'Under Contract';
        const acreage = formatAcreage(listing.lot_size_acres, listing.lot_size_sqft);
        const price = formatPrice(listing.asking_price);
        const location = [listing.county, listing.state].filter(Boolean).join(', ');

        const popup = L.popup({ maxWidth: 240, className: 'lotscout-popup' }).setContent(`
          <div style="font-family:system-ui,sans-serif;padding:2px 0;">
            <div style="font-weight:700;font-size:13px;color:#0f2d1f;margin-bottom:4px;line-height:1.3;">${listing.title ?? 'Unnamed Listing'}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${location}${acreage ? ` · ${acreage}` : ''}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:15px;font-weight:800;color:#1a7a4a;">${price}</span>
              ${listing.zoning ? `<span style="font-size:9px;font-weight:700;background:#f0fdf4;color:#166534;padding:2px 6px;border-radius:99px;text-transform:uppercase;">${listing.zoning}</span>` : ''}
            </div>
            ${isUnderContract ? `<div style="font-size:10px;color:#94a3b8;font-weight:600;margin-bottom:6px;">UNDER CONTRACT</div>` : ''}
            <a href="/listings/${listing.id}" style="display:block;text-align:center;background:#1a7a4a;color:white;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;text-decoration:none;">View Listing →</a>
          </div>
        `);

        const marker = L.marker([listing.latitude, listing.longitude], {
          icon: isUnderContract ? makeContractIcon() : makeGreenIcon(),
        }).bindPopup(popup);

        marker.on('click', () => onPinClickRef.current?.(listing.id));

        // Apply current filter state immediately so newly-added markers reflect active filters
        const opacity = !currentFilteredIds || currentFilteredIds.size === 0 || currentFilteredIds.has(listing.id) ? 1 : 0.15;
        marker.setOpacity(opacity);

        markersRef.current.set(listing.id, marker);
        marker.addTo(map);
      });
    });

    return () => { cancelled = true; };
  }, [listings]); // re-runs when listings arrive or change

  // Keep the map from hijacking normal page scroll/touch. Users explicitly unlock it
  // when they want to pan or pinch the map; wheel zoom stays off to avoid fly-away zooms.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const toggle = (handler: { enable?: () => void; disable?: () => void } | undefined, enabled: boolean) => {
      if (!handler) return;
      if (enabled) handler.enable?.();
      else handler.disable?.();
    };

    toggle(map.dragging, mapUnlocked);
    toggle(map.touchZoom, mapUnlocked);
    toggle(map.doubleClickZoom, mapUnlocked);
    toggle(map.boxZoom, mapUnlocked);
    toggle(map.keyboard, mapUnlocked);
    map.scrollWheelZoom?.disable?.();
  }, [mapUnlocked]);

  // Destroy map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Highlight the hovered card's pin
  useEffect(() => {
    const L = leafletRef.current;
    if (!L) return;
    markersRef.current.forEach((marker, id) => {
      if (id === highlightedId) {
        marker.setIcon(L.divIcon({
          className: '',
          html: `<div style="background:#15803d;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }));
        marker.setZIndexOffset(1000);
      } else {
        marker.setIcon(L.divIcon({
          className: '',
          html: `<div style="background:#1D9E75;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }));
        marker.setZIndexOffset(0);
      }
    });
  }, [highlightedId]);

  // Dim pins that don't match active filters
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const opacity = !filteredIds || filteredIds.size === 0 || filteredIds.has(id) ? 1 : 0.15;
      marker.setOpacity(opacity);
    });
  }, [filteredIds]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-outline-variant/20">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <button
        type="button"
        onClick={() => setMapUnlocked(v => !v)}
        className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow text-xs font-bold text-slate-700 flex items-center gap-1.5 z-[1000] border border-black/10"
        aria-pressed={mapUnlocked}
      >
        <span className="material-symbols-outlined text-base">{mapUnlocked ? 'lock_open' : 'lock'}</span>
        {mapUnlocked ? 'Map unlocked' : 'Move map'}
      </button>
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow text-xs font-semibold text-slate-600 flex items-center gap-3 z-[1000]">
        <span className="flex items-center gap-1.5">
          <span style={{ width:10,height:10,borderRadius:'50%',background:'#1D9E75',display:'inline-block',border:'2px solid white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width:10,height:10,borderRadius:'50%',background:'#94a3b8',display:'inline-block',border:'2px solid white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
          Under Contract
        </span>
        <span className="text-slate-400">{listings.length} listings</span>
      </div>
    </div>
  );
}
