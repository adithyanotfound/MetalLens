"use client";

import { useEffect, useState } from "react";

type ApiResponse = {
  table?: { table_schema: string; table_name: string };
  count?: number;
  averageHpi?: number;
  averageHei?: number;
  rows?: Array<Record<string, any>>;
  error?: string;
};

export default function HpiHeiSummary() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/hpi-hei", { cache: "no-store" });
        const json = (await res.json()) as ApiResponse;
        setData(json);
      } catch (e) {
        setData({ error: (e as any)?.message ?? "Failed to load" });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return <div className="text-sm opacity-70">Loading HPI/HEI…</div>;
  }

  if (!data || data.error) {
    return <div className="text-sm text-red-400">{data?.error ?? "No data"}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[#0b0f17] p-4 rounded">
        <div className="text-xs opacity-70">Average HPI</div>
        <div className="text-2xl font-semibold">{(data.averageHpi ?? 0).toFixed(2)}</div>
      </div>
      <div className="bg-[#0b0f17] p-4 rounded">
        <div className="text-xs opacity-70">Average HEI</div>
        <div className="text-2xl font-semibold">{(data.averageHei ?? 0).toFixed(2)}</div>
      </div>
    </div>
  );
}


