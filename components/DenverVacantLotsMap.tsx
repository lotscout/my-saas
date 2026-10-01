'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type DenverVacantLot = {
  attomId: string;
  apn?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  propertyType?: string;
  landUse?: string;
  zoning?: string;
  lotSqft?: number | null;
  lotAcres?: number | null;
  ownerName?: string;
  ownerMailingAddress?: string;
  assessedTotal?: number | null;
  assessedLand?: number | null;
  lastSalePrice?: number | null;
  lastSaleDate?: string;
};

type Props = {
  lots: DenverVacantLot[];
  filteredIds?: Set<string>;
  selectedId?: string | null;
  onSelect?: (lot: DenverVacantLot) => void;
};

function esc(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function fmtNumber(value?: number | null) {
  return value ? value.toLocaleString() : '—';
}

function fmtMoney(value?: number | null) {
  return value ? `$${value.toLocaleString()}` : '—';
}

export default function DenverVacantLotsMap({ lots, filteredIds, selectedId, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const onSelectRef = useRef(onSelect);
  const filteredIdsRef = useRef(filteredIds);
  const [mapUnlocked, setMapUnlocked] = useState(true);

  useEffect(() => { onSelectRef.current = onSelect; });
  useEffect(() => { filteredIdsRef.current = filteredIds; }, [filteredIds]);

  const plottableLots = useMemo(() => lots.filter(lot => lot.lat && lot.lng), [lots]);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    import('leaflet').then(async L => {
      if (cancelled) return;
      await import('leaflet/dist/leaflet.css');
      if (cancelled) return;

      leafletRef.current = L;
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          preferCanvas: true,
        }).setView([39.7392, -104.9903], 11);
        mapInstanceRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      }

      const map = mapInstanceRef.current;
      if (markerLayerRef.current) markerLayerRef.current.remove();
      markerLayerRef.current = L.layerGroup().addTo(map);
      markersRef.current.clear();

      const currentFiltered = filteredIdsRef.current;
      const bounds: [number, number][] = [];

      plottableLots.forEach(lot => {
        const id = lot.attomId || `${lot.address}-${lot.lat}-${lot.lng}`;
        const opacity = !currentFiltered || currentFiltered.size === 0 || currentFiltered.has(id) ? 0.86 : 0.08;
        const fill = lot.zip === '80216' || lot.zip === '80204' || lot.zip === '80249' ? '#D6A13D' : '#10291E';
        const marker = L.circleMarker([lot.lat, lot.lng], {
          radius: 4,
          weight: 1.4,
          color: '#ffffff',
          fillColor: fill,
          fillOpacity: opacity,
          opacity: Math.max(opacity, 0.2),
          pane: 'markerPane',
        });

        marker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;min-width:220px;max-width:280px;padding:2px 0;">
            <div style="font-size:14px;font-weight:900;color:#10291E;line-height:1.25;margin-bottom:4px;">${esc(lot.address || 'Vacant lot')}</div>
            <div style="font-size:11px;font-weight:700;color:#6B7280;margin-bottom:9px;">${esc(lot.city)}, ${esc(lot.state)} ${esc(lot.zip)} · ATTOM ${esc(lot.attomId)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
              <div><b>Owner</b><br/>${esc(lot.ownerName || 'Not enriched')}</div>
              <div><b>Land use</b><br/>${esc(lot.landUse || 'Vacant land')}</div>
              <div><b>Zoning</b><br/>${esc(lot.zoning || 'Not enriched')}</div>
              <div><b>Lot sqft</b><br/>${esc(fmtNumber(lot.lotSqft))}</div>
              <div><b>Acres</b><br/>${esc(lot.lotAcres ? lot.lotAcres.toFixed(3) : '—')}</div>
              <div><b>Assessed</b><br/>${esc(fmtMoney(lot.assessedTotal))}</div>
              <div><b>Last sale</b><br/>${esc(fmtMoney(lot.lastSalePrice))}</div>
              <div><b>Sale date</b><br/>${esc(lot.lastSaleDate || '—')}</div>
            </div>
            <div style="margin-top:9px;font-size:11px;color:#475569;"><b>APN:</b> ${esc(lot.apn || '—')}</div>
          </div>
        `, { maxWidth: 320, className: 'lotscout-popup' });
        marker.on('click', () => onSelectRef.current?.(lot));
        marker.addTo(markerLayerRef.current);
        markersRef.current.set(id, marker);
        bounds.push([lot.lat, lot.lng]);
      });

      if (bounds.length) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
    });

    return () => { cancelled = true; };
  }, [plottableLots]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const visible = !filteredIds || filteredIds.size === 0 || filteredIds.has(id);
      marker.setStyle?.({ fillOpacity: visible ? 0.86 : 0.08, opacity: visible ? 1 : 0.16 });
    });
  }, [filteredIds]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    marker.setStyle?.({ radius: 8, fillColor: '#D6A13D', fillOpacity: 1, color: '#10291E', weight: 2.5 });
    marker.openPopup?.();
    const latlng = marker.getLatLng?.();
    if (latlng) map.panTo(latlng, { animate: true });
    return () => marker.setStyle?.({ radius: 4, color: '#ffffff', weight: 1.4 });
  }, [selectedId]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const toggle = (handler: { enable?: () => void; disable?: () => void } | undefined, enabled: boolean) => enabled ? handler?.enable?.() : handler?.disable?.();
    toggle(map.dragging, mapUnlocked);
    toggle(map.touchZoom, mapUnlocked);
    toggle(map.doubleClickZoom, mapUnlocked);
    toggle(map.boxZoom, mapUnlocked);
    toggle(map.keyboard, mapUnlocked);
    if (mapUnlocked) map.scrollWheelZoom?.enable?.();
    else map.scrollWheelZoom?.disable?.();
  }, [mapUnlocked]);

  useEffect(() => () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, []);

  return (
    <div className="relative h-full min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <div ref={mapRef} className="h-full min-h-[560px] w-full" />
      <button
        type="button"
        onClick={() => setMapUnlocked(v => !v)}
        className="absolute right-4 top-4 z-[1000] rounded-xl border border-black/10 bg-white/95 px-3 py-2 text-xs font-black text-slate-700 shadow backdrop-blur hover:bg-white"
      >
        {mapUnlocked ? 'Map active' : 'Map locked'}
      </button>
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow backdrop-blur">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border-2 border-white bg-[#10291E] shadow" />Vacant lot</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border-2 border-white bg-[#D6A13D] shadow" />High-volume ZIP</span>
        <span className="text-slate-400">{plottableLots.length.toLocaleString()} points</span>
      </div>
    </div>
  );
}
