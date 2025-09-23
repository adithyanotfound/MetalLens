"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Station = { id: string | number; name: string; lat: number; lng: number };

type IndiaMapProps = {
  className?: string;
  stations?: Station[];
  onSelect?: (s: Station) => void;
};

export default function IndiaMap({ className, stations = [], onSelect }: IndiaMapProps) {
  const center = useMemo(() => ({ lat: 22.9734, lng: 78.6569 }), []);

  return (
    <div className={className}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={4}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", borderRadius: 8 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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


