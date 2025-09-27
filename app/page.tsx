"use client";
import dynamic from "next/dynamic";
import StateBarChart from "./components/StateBarChart";
import FiltersPanel from "./components/FiltersPanel";
import SearchBar from "./components/SearchBar";
import DataPreview from "./components/DataPreview";
import TimeSeriesChart from "./components/TimeSeriesChart";
import ResizableColumns from "./components/ResizableColumns";
import { useEffect, useState } from "react";

type Row = {
  region: string;
  hpi: number;
  hei: number;
};

const sampleData: Row[] = [
  { region: "India", hpi: 68.2, hei: 0.64 },
  { region: "Maharashtra", hpi: 61.5, hei: 0.67 },
  { region: "Karnataka", hpi: 63.3, hei: 0.69 },
];

type Station = { id: string | number; name: string; lat: number; lng: number };

const IndiaMap = dynamic(() => import("./components/IndiaMap"), { ssr: false });

export default function Home() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<Station | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [totalStations, setTotalStations] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/stations", { cache: "no-store" });
        const json = await res.json();
        setStations(json.rows ?? []);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await fetch("/api/stations/count", { cache: "no-store" });
        const json = await res.json();
        setTotalStations(json.count ?? null);
      } catch {
        setTotalStations(null);
      }
    };
    loadCount();
  }, []);

  // Load initial averages and react to station or state changes
  useEffect(() => {
    const load = async () => {
      try {
        if (selected) {
          const res = await fetch(`/api/stations/${encodeURIComponent(String(selected.id))}`, { cache: "no-store" });
          const json = await res.json();
          setMeasurements(json.rows ?? []);
          return;
        }
        const url = selectedState ? `/api/aggregate?state=${encodeURIComponent(selectedState)}` : "/api/aggregate";
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        setMeasurements(json.rows ?? []);
      } catch {
        setMeasurements([]);
      }
    };
    load();
  }, [selected, selectedState]);

  // Log each row from database when station is selected
  useEffect(() => {
    if (!selected || measurements.length === 0) return;
    // eslint-disable-next-line no-console
    console.log("Selected station:", selected.name);
    measurements.forEach((row, index) => {
      // eslint-disable-next-line no-console
      console.log(`Row ${index + 1}:`, row);
    });
  }, [selected, measurements]);

  return (
    <div className="min-h-screen p-4 bg-[#0f1115] text-[#e5e7eb]">
      <ResizableColumns
        left={
          <aside className="rounded-md bg-[#161a22] p-4 h-full hidden md:block space-y-4">
            <SearchBar
              onSelectStation={(s) => {
                setSelectedState(null);
                setSelected(s);
                setFocus({ lat: s.lat, lng: s.lng });
              }}
              onSelectState={(stateName, center) => {
                setSelected(null);
                setSelectedState(stateName);
                if (center) setFocus(center);
              }}
            />
            <FiltersPanel />
            <DataPreview rows={measurements} />
          </aside>
        }
        center={
          <main className="rounded-md overflow-hidden bg-[#0b0f17] h-full">
            <IndiaMap className="h-[calc(100vh-32px)]" stations={stations} onSelect={setSelected} focus={focus} focusZoom={selected ? 11 : selectedState ? 6 : 4} />
      </main>
        }
        right={
          <section className="rounded-md bg-[#161a22] p-4 space-y-4 h-full overflow-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0b0f17] p-4 rounded">
                <div className="text-xs opacity-70">Selected Station</div>
                <div className="text-base font-semibold">{selected?.name ?? "None"}</div>
              </div>
              <div className="bg-[#0b0f17] p-4 rounded">
                <div className="text-xs opacity-70">Total Stations</div>
                <div className="text-base font-semibold">{totalStations ?? "-"}</div>
              </div>
            </div>

            <div className="bg-[#0b0f17] rounded p-3">
              <div className="text-sm font-medium mb-2">{selectedState ? "District Wise Station Count" : "State Wise Station Count"}</div>
              <StateBarChart state={selectedState ?? undefined} />
            </div>

            <TimeSeriesChart rows={measurements} />

            {/* Duplicate Data Preview removed; already shown in left sidebar */}
          </section>
        }
      />
    </div>
  );
}
