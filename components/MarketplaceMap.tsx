'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons (Next.js SSR issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapListing {
  id: number;
  title: string;
  location: string;
  acreage: string;
  price: string;
  lat: number;
  lng: number;
  promoted?: boolean;
}

function FitBounds({ listings }: { listings: MapListing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map(l => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [listings, map]);
  return null;
}

const promotedIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#d97706;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const normalIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:8px;height:8px;background:#1a5c38;border-radius:50%;border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

export default function MarketplaceMap({ listings, selectedId, onSelect }: {
  listings: MapListing[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
}) {
  if (listings.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-container-low rounded-2xl">
        <p className="text-secondary text-sm">No listings to show on map</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[listings[0].lat, listings[0].lng]}
      zoom={5}
      className="w-full h-full rounded-2xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds listings={listings} />
      {listings.map(listing => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={listing.promoted ? promotedIcon : normalIcon}
          eventHandlers={{ click: () => onSelect?.(listing.id) }}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-bold text-sm text-gray-900 mb-0.5">{listing.title}</p>
              <p className="text-xs text-gray-500 mb-1">{listing.location}</p>
              <div className="flex gap-2 text-xs font-bold">
                <span className="text-green-700">{listing.price}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{listing.acreage}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
