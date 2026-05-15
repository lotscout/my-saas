'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

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
}

function formatPrice(n: number | null): string {
  if (!n) return 'Price on Request';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}

function formatAcreage(acres: number | null, sqft: number | null): string {
  if (acres) return `${acres.toLocaleString()} Acres`;
  if (sqft) return `${sqft.toLocaleString()} Sq Ft`;
  return '';
}

export default function ListingsMap({ listings }: ListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css');

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView([39.5, -98.35], 4);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Custom green marker icon
      const greenIcon = L.divIcon({
        className: '',
        html: `<div style="
          background:#1a7a4a;
          width:12px;height:12px;
          border-radius:50%;
          border:2px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const contractIcon = L.divIcon({
        className: '',
        html: `<div style="
          background:#94a3b8;
          width:10px;height:10px;
          border-radius:50%;
          border:2px solid white;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      // Filter out listings with missing or zero coordinates before plotting
      const plottable = listings.filter(
        l => l.latitude && l.longitude && l.latitude !== 0 && l.longitude !== 0
      );

      console.log(
        `[ListingsMap] ${listings.length} listings received, ${plottable.length} plottable. ` +
        `Sample coords (lat, lng):`,
        plottable.slice(0, 5).map(l => ({ id: l.id, lat: l.latitude, lng: l.longitude, state: l.state, county: l.county }))
      );

      plottable.forEach(listing => {
        const isUnderContract = listing.ownership_type === 'Under Contract';
        const icon = isUnderContract ? contractIcon : greenIcon;

        const acreage = formatAcreage(listing.lot_size_acres, listing.lot_size_sqft);
        const price = formatPrice(listing.asking_price);
        const location = [listing.county, listing.state].filter(Boolean).join(', ');

        const popup = L.popup({ maxWidth: 240, className: 'lotscout-popup' }).setContent(`
          <div style="font-family:system-ui,sans-serif;padding:2px 0;">
            <div style="font-weight:700;font-size:13px;color:#0f2d1f;margin-bottom:4px;line-height:1.3;">
              ${listing.title ?? 'Unnamed Listing'}
            </div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${location}${acreage ? ` · ${acreage}` : ''}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:15px;font-weight:800;color:#1a7a4a;">${price}</span>
              ${listing.zoning ? `<span style="font-size:9px;font-weight:700;background:#f0fdf4;color:#166534;padding:2px 6px;border-radius:99px;text-transform:uppercase;">${listing.zoning}</span>` : ''}
            </div>
            ${isUnderContract ? `<div style="font-size:10px;color:#94a3b8;font-weight:600;margin-bottom:6px;">UNDER CONTRACT</div>` : ''}
            <a href="/listings/${listing.id}" style="display:block;text-align:center;background:#1a7a4a;color:white;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;text-decoration:none;">
              View Listing →
            </a>
          </div>
        `);

        L.marker([listing.latitude, listing.longitude], { icon })
          .bindPopup(popup)
          .addTo(map);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [listings]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/20" style={{ height: 'clamp(280px, 50vw, 600px)' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow text-xs font-semibold text-slate-600 flex items-center gap-3 z-[1000]">
        <span className="flex items-center gap-1.5">
          <span style={{ width:10,height:10,borderRadius:'50%',background:'#1a7a4a',display:'inline-block',border:'2px solid white',boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
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
