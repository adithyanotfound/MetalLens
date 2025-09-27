"use client";
import { useEffect, useState } from "react";

interface Meta {
  states: string[];
  agencies: string[];
  years: number[];
}

interface Props {}

export default function FiltersPanel({}: Props) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [districts, setDistricts] = useState<string[]>([]);

  const [stateSel, setStateSel] = useState<string>("");
  const [districtSel, setDistrictSel] = useState<string>("");
  const [agencySel, setAgencySel] = useState<string>("");
  const [startYear, setStartYear] = useState<string>("2015");
  const [endYear, setEndYear] = useState<string>("2025");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/filters/meta", { cache: "no-store" });
      const json = await res.json();
      setMeta(json);
    };
    load();
  }, []);

  useEffect(() => {
    if (!stateSel) return setDistricts([]);
    const run = async () => {
      const res = await fetch(`/api/filters/districts?state=${encodeURIComponent(stateSel)}`, { cache: "no-store" });
      const json = await res.json();
      setDistricts(json.districts ?? []);
    };
    run();
  }, [stateSel]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (stateSel) params.append("state", stateSel);
    if (districtSel) params.append("district", districtSel);
    if (agencySel) params.append("agency", agencySel);
    if (startYear) params.append("startYear", startYear);
    if (endYear) params.append("endYear", endYear);

    const url = `/api/export?${params.toString()}`;
    window.open(url, "_blank");
  };

  if (!meta) {
    return <div className="text-sm opacity-70">Loading filters…</div>;
  }

  return (
    <div className="space-y-3 text-sm">
      {/* State */}
      <div>
        <div className="opacity-70 mb-1">State / UTs</div>
        <select
          className="w-full bg-[#0b0f17] rounded px-3 py-2"
          value={stateSel}
          onChange={(e) => {
            setStateSel(e.target.value);
            setDistrictSel("");
          }}
        >
          <option value="">All</option>
          {meta.states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {/* District */}
      <div>
        <div className="opacity-70 mb-1">District</div>
        <select
          className="w-full bg-[#0b0f17] rounded px-3 py-2"
          value={districtSel}
          onChange={(e) => setDistrictSel(e.target.value)}
          disabled={!stateSel}
        >
          <option value="">All</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      {/* Agency */}
      <div>
        <div className="opacity-70 mb-1">Agency</div>
        <select
          className="w-full bg-[#0b0f17] rounded px-3 py-2"
          value={agencySel}
          onChange={(e) => setAgencySel(e.target.value)}
        >
          <option value="">All</option>
          {meta.agencies.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      {/* Year range */}
      <div>
        <div className="opacity-70 mb-1">Year Range</div>
        <div className="flex gap-2">
          <select
            className="bg-[#0b0f17] rounded px-3 py-2"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
          >
            {meta.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="bg-[#0b0f17] rounded px-3 py-2"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
          >
            {meta.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={handleExport} className="w-full px-3 py-2 rounded bg-[#0ea5e9]/80 hover:bg-[#0ea5e9]">
        Download CSV
      </button>
    </div>
  );
}
