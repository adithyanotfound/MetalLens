"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  className?: string;
  state?: string | null;
};

export default function StateBarChart({ className, state }: Props) {
  const [rows, setRows] = useState<Array<{ label: string; total: number; monitored: number }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const url = state
          ? `/api/stations/state-count?state=${encodeURIComponent(state)}`
          : "/api/stations/state-count";
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        const mapped = (json.rows ?? []).map((r: { state?: string; district?: string; total: number; monitored: number }) => ({
          label: r.state ?? r.district ?? "Unknown",
          total: r.total,
          monitored: r.monitored,
        }));
        setRows(mapped);
      } catch {}
    };
    load();
  }, [state]);

  const labels = rows.map((r) => r.label);
  const totals = rows.map((r) => r.total);
  const monitored = rows.map((r) => r.monitored);

  // fallback if no data yet
  const displayLabels = labels.length ? labels : ["Loading"];
  const displayTotals = totals.length ? totals : [0];
  const displayMonitored = monitored.length ? monitored : [0];

  const data = {
    labels: displayLabels,
    datasets: [
      {
        label: "Total Stations",
        data: displayTotals,
        backgroundColor: "rgba(59,130,246,0.6)",
      },
      {
        label: "Total Monitored Stations",
        data: displayMonitored,
        backgroundColor: "rgba(16,185,129,0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom" as const },
    },
    scales: {
      x: { ticks: { color: "#9ca3af" } },
      y: { ticks: { color: "#9ca3af" } },
    },
  };

  return (
    <div className={className}>
      <div className="h-[320px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}


