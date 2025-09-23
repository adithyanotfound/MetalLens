"use client";
import dynamic from "next/dynamic";
import StateBarChart from "./components/StateBarChart";
import ParameterLineChart from "./components/ParameterLineChart";
import ResizableColumns from "./components/ResizableColumns";
import { useEffect, useMemo, useState } from "react";
import MetalsChart from "./components/MetalsChart";

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
  const [measurements, setMeasurements] = useState<any[]>([]);

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
    const load = async () => {
      if (!selected) return setMeasurements([]);
      try {
        const res = await fetch(`/api/stations/${encodeURIComponent(String(selected.id))}`, { cache: "no-store" });
        const json = await res.json();
        setMeasurements(json.rows ?? []);
      } catch {
        setMeasurements([]);
      }
    };
    load();
  }, [selected]);

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
          <aside className="rounded-md bg-[#161a22] p-4 h-full hidden md:block">
        <h2 className="text-sm font-semibold mb-3">Unitwise Selection</h2>
        <div className="space-y-3 text-sm">
          <div>
            <div className="opacity-70 mb-1">Scope</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-[#0ea5e9]/20">State / UTs</button>
              <button className="px-3 py-1 rounded bg-[#111827]">Basin</button>
            </div>
          </div>
          <div>
            <div className="opacity-70 mb-1">Source</div>
            <div className="bg-[#0b0f17] rounded px-3 py-2">All Agencies</div>
          </div>
          <div>
            <div className="opacity-70 mb-1">State / UTs</div>
            <div className="bg-[#0b0f17] rounded px-3 py-2">Select State</div>
          </div>
          <div>
            <div className="opacity-70 mb-1">District</div>
            <div className="bg-[#0b0f17] rounded px-3 py-2">Select</div>
          </div>
          <div>
            <div className="opacity-70 mb-1">Timestep</div>
            <div className="bg-[#0b0f17] rounded px-3 py-2">Yearly</div>
          </div>
          <div>
            <div className="opacity-70 mb-1">Date Range</div>
            <div className="flex gap-2">
              <div className="bg-[#0b0f17] rounded px-3 py-2">2015</div>
              <div className="bg-[#0b0f17] rounded px-3 py-2">2025</div>
            </div>
          </div>
        </div>
          </aside>
        }
        center={
          <main className="rounded-md overflow-hidden bg-[#0b0f17] h-full">
            <IndiaMap className="h-[calc(100vh-32px)]" stations={stations} onSelect={setSelected} />
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
                <div className="text-base font-semibold">{stations.length}</div>
              </div>
            </div>

            <div className="bg-[#0b0f17] rounded p-3">
              <div className="text-sm font-medium mb-2">State Wise Station Count</div>
              <StateBarChart />
            </div>

            <div className="bg-[#0b0f17] rounded p-3">
              <div className="text-sm font-medium mb-2">Station Parameters Over Time</div>
              <ParameterLineChart
                labels={measurements.map((r) => r.date_collected ?? r.date ?? "")}
                series={[
                  { label: "HPI", data: measurements.map((r) => Number(r.hpi ?? 0)), color: "#22c55e", yAxisID: "y" },
                  { label: "HEI", data: measurements.map((r) => Number(r.hei ?? 0)), color: "#f59e0b", yAxisID: "y2" },
                ]}
                useTimeAxis
              />
              <div className="text-xs opacity-70 mt-2">Data reflects selected station</div>
            </div>

            <div className="bg-[#0b0f17] rounded p-3">
              <div className="text-sm font-medium mb-2">Metals Over Time</div>
              <MetalsChart rows={measurements} />
            </div>

            <div className="bg-[#0b0f17] rounded p-3">
              <div className="text-sm font-medium mb-2">Data Preview</div>
              <div className="overflow-auto max-h-[260px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left opacity-70">
                      <th className="px-2 py-1">Date</th>
                      <th className="px-2 py-1">HPI</th>
                      <th className="px-2 py-1">HEI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-white/10">
                        <td className="px-2 py-1">{String(r.date_collected ?? r.date ?? "").slice(0, 10)}</td>
                        <td className="px-2 py-1">{r.hpi ?? ""}</td>
                        <td className="px-2 py-1">{r.hei ?? ""}</td>
                      </tr>
                    ))}
                    {measurements.length === 0 && (
                      <tr>
                        <td className="px-2 py-2 opacity-60" colSpan={3}>No records</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        }
      />
    </div>
  );
}
