"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import IndiaMap from "./IndiaMap";
import StateBarChart from "./StateBarChart";
import ParameterLineChart from "./ParameterLineChart";

type Station = { id: string | number; name: string; lat: number; lng: number; hpi?: number | null; hei?: number | null };

export default function DashboardClient() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<Station | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/stations`, { cache: "no-store" });
        const json = await res.json();
        setStations(json.rows ?? []);
      } catch {
        setStations([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selected) return;
      const res = await fetch(`/api/stations/${encodeURIComponent(selected.id)}`, { cache: "no-store" });
      const json = await res.json();
      setMeasurements(json.rows ?? []);
    };
    load();
  }, [selected]);

  const handleSelect = useCallback((s: Station) => setSelected(s), []);

  // Compute averages when a station is selected
  const avgHpi = useMemo(() => {
    const xs = measurements.filter((r) => typeof (r as { hpi?: unknown }).hpi === "number").map((r) => (r as { hpi: number }).hpi);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }, [measurements]);
  const avgHei = useMemo(() => {
    const xs = measurements.filter((r) => typeof (r as { hei?: unknown }).hei === "number").map((r) => (r as { hei: number }).hei);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }, [measurements]);

  return (
    <div className="w-full h-full grid grid-cols-[300px_1fr_420px] gap-4">
      <aside className="rounded-md bg-[#161a22] p-4 hidden md:block">
        <h2 className="text-sm font-semibold mb-3">Unitwise Selection</h2>
        <div className="text-xs opacity-70">Stations loaded: {stations.length}</div>
      </aside>

      <main className="rounded-md overflow-hidden bg-[#0b0f17] relative">
        <IndiaMap className="h-[calc(100vh-32px)]" stations={stations} onSelect={handleSelect} />
      </main>

      <section className="rounded-md bg-[#161a22] p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0b0f17] p-4 rounded">
            <div className="text-xs opacity-70">Selected Station</div>
            <div className="text-base font-semibold">{selected?.name ?? "None"}</div>
          </div>
          <div className="bg-[#0b0f17] p-4 rounded">
            <div className="text-xs opacity-70">Measurements</div>
            <div className="text-base font-semibold">{measurements.length}</div>
          </div>
        </div>

        <div className="bg-[#0b0f17] p-4 rounded grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs opacity-70">Average HPI</div>
            <div className="text-2xl font-semibold">{avgHpi.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Average HEI</div>
            <div className="text-2xl font-semibold">{avgHei.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-[#0b0f17] rounded p-3">
          <div className="text-sm font-medium mb-2">State Wise Station Count</div>
          <StateBarChart />
        </div>

        <div className="bg-[#0b0f17] rounded p-3">
          <div className="text-sm font-medium mb-2">Parameter Wise Station Count</div>
          <ParameterLineChart />
        </div>
      </section>
    </div>
  );
}


