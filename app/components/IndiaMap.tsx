"use client";

import { useEffect, useMemo, useState } from "react";
import { useMap } from "react-leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Station = { id: string | number; name: string; lat: number; lng: number; hpi?: number | null; hei?: number | null };

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

type Quality = "green" | "yellow" | "red" | "grey";

function classifyHpi(hpi: number | null | undefined): Quality {
  if (typeof hpi !== 'number' || Number.isNaN(hpi)) return "grey";
  if (hpi < 100) return "green";
  if (hpi < 150) return "yellow";
  return "red";
}

function classifyHei(hei: number | null | undefined): Quality {
  if (typeof hei !== 'number' || Number.isNaN(hei)) return "grey";
  if (hei < 10) return "green";
  if (hei < 20) return "yellow";
  return "red";
}

function deriveOverallQuality(hpi: number | null | undefined, hei: number | null | undefined): Quality {
  const h = classifyHpi(hpi);
  const e = classifyHei(hei);
  if (h === "grey" && e === "grey") return "grey";
  if (h === "red" || e === "red") return "red";
  if (h === "yellow" || e === "yellow") return "yellow";
  return "green";
}

function colorForStation(s: Station): string {
  const q = deriveOverallQuality(s.hpi, s.hei);
  switch (q) {
    case "green": return "#22c55e"; // Drinkable
    case "yellow": return "#eab308"; // Moderately polluted
    case "red": return "#ef4444"; // Not drinkable
    default: return "#9ca3af"; // Grey: No data
  }
}

export default function IndiaMap({ className, stations = [], onSelect, focus = null, focusZoom = null }: IndiaMapProps) {
  const center = useMemo(() => ({ lat: 22.9734, lng: 78.6569 }), []);
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Map = MapContainer as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tile = TileLayer as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Circle = CircleMarker as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GJ = GeoJSON as any;
  const handleEachFeature = (_: unknown, layer: { setStyle: (style: { fillOpacity: number }) => void; on: (events: { mouseover: () => void; mouseout: () => void }) => void }) => {
    layer.on({
      mouseover: () => layer.setStyle({ fillOpacity: 0.2 }),
      mouseout: () => layer.setStyle({ fillOpacity: 0.05 }),
    });
  };
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
    <div className={`${className ?? ""} relative`}>
      <div
        className="absolute top-3 right-3 z-[5000] bg-[#161a22] text-xs rounded px-2 py-1 pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
          <div className="font-semibold mb-1">Legend</div>
          <div className="flex items-center gap-2 mb-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#22c55e" }} /> <span>Drinkable</span></div>
          <div className="flex items-center gap-2 mb-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#eab308" }} /> <span>Moderately polluted</span></div>
          <div className="flex items-center gap-2 mb-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#ef4444" }} /> <span>Not drinkable</span></div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#9ca3af" }} /> <span>No data</span></div>
      </div>
      <Map
        center={[center.lat, center.lng] as [number, number]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", borderRadius: 8 }}
      >
        {focus && <Recenter pos={focus} zoom={focusZoom ?? undefined} />}
        <Tile
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJson && (
          <GJ
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={geoJson as any}
            style={{ color: "#1f2937", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.05 }}
            onEachFeature={handleEachFeature}
          />
        )}
        {stations.map((s) => (
          <Circle
            key={`${s.id}-${colorForStation(s)}`}
            center={[s.lat, s.lng]}
            radius={3}
            pathOptions={{ color: colorForStation(s), fillColor: colorForStation(s), fillOpacity: 0.9 }}
            eventHandlers={{ click: () => onSelect?.(s) }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{s.name}</div>
                <div>Lat: {s.lat.toFixed(3)}</div>
                <div>Lng: {s.lng.toFixed(3)}</div>
                {typeof s.hpi === 'number' && <div>HPI: {s.hpi.toFixed(2)}</div>}
                {typeof s.hei === 'number' && <div>HEI: {s.hei.toFixed(2)}</div>}
              </div>
            </Popup>
          </Circle>
        ))}
      </Map>
    </div>
  );
}


