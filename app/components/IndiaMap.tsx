"use client";

import { useEffect, useMemo, useState } from "react";
import { useMap } from "react-leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Station = { id: string | number; name: string; lat: number; lng: number };

type IndiaMapProps = {
  className?: string;
  stations?: Station[];
  onSelect?: (s: Station) => void;
  focus?: { lat: number; lng: number } | null;
  focusZoom?: number | null;
};

function Recenter({ pos, zoom }: { pos: { lat: number; lng: number }, zoom?: number | null }) {
  const map = useMap();
  map.setView([pos.lat, pos.lng], typeof zoom === 'number' ? zoom : map.getZoom());
  return null;
}

export default function IndiaMap({ className, stations = [], onSelect, focus = null, focusZoom = null }: IndiaMapProps) {
  const center = useMemo(() => ({ lat: 22.9734, lng: 78.6569 }), []);
  const [geoJson, setGeoJson] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/india-geojson@1.0.0/india_states.geojson", { cache: 'force-cache' });
        const json = await res.json();
        if (mounted) setGeoJson(json);
      } catch {}
    };
    run();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={className}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", borderRadius: 8 }}
      >
        {focus && <Recenter pos={focus} zoom={focusZoom ?? undefined} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJson && (
          <GeoJSON
            data={geoJson as any}
            style={{ color: "#1f2937", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.05 }}
            onEachFeature={(_, layer) => {
              layer.on({
                mouseover: () => layer.setStyle({ fillOpacity: 0.2 }),
                mouseout: () => layer.setStyle({ fillOpacity: 0.05 }),
              });
            }}
          />
        )}
        {stations.map((s) => (
          <CircleMarker
            key={String(s.id)}
            center={[s.lat, s.lng]}
            radius={3}
            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }}
            eventHandlers={{ click: () => onSelect?.(s) }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{s.name}</div>
                <div>Lat: {s.lat.toFixed(3)}</div>
                <div>Lng: {s.lng.toFixed(3)}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}


