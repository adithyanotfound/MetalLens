"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type Props = {
  className?: string;
  labels?: (string | number | Date)[];
  series?: Array<{ label: string; data: number[]; color?: string; yAxisID?: string }>;
  useTimeAxis?: boolean;
  chartId?: string;
};

export default function ParameterLineChart({ className, labels, series, useTimeAxis, chartId }: Props) {
  const fallbackLabels = [
    "2015",
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
  ];

  const chosenLabels = labels && labels.length ? labels : fallbackLabels;

  const defaultSeries = [
    { label: "HPI", data: chosenLabels.map((_, i) => 40 + i * 2), color: "#22c55e", yAxisID: "y" },
    { label: "HEI", data: chosenLabels.map((_, i) => 0.6 - i * 0.02), color: "#f59e0b", yAxisID: "y" },
  ];

  const datasets = (series?.length ? series : defaultSeries).map((s) => ({
    label: s.label,
    data: s.data,
    borderColor: s.color ?? "#3b82f6",
    tension: 0.3,
    pointRadius: 0,
    yAxisID: s.yAxisID ?? "y",
  }));

  const data = {
    labels: chosenLabels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom" as const },
      tooltip: {
        enabled: true,
        mode: 'nearest' as const,
        intersect: false,
        callbacks: {
          label: function(ctx: { dataset?: { label?: string }; parsed?: { y?: number }; raw?: unknown }) {
            const label = ctx.dataset?.label ? `${ctx.dataset.label}: ` : '';
            const value = typeof ctx.parsed?.y === 'number' ? ctx.parsed.y : ctx.raw;
            const fixed = typeof value === 'number' ? value.toFixed(4) : value;
            return `${label}${fixed}`;
          }
        }
      },
    },
    elements: { point: { radius: 0 } },
    scales: {
      x: useTimeAxis
        ? { type: "time" as const, time: { unit: "month" as const }, ticks: { color: "#9ca3af" } }
        : { ticks: { color: "#9ca3af" } },
      y: { ticks: { color: "#9ca3af" } },
      y2: { position: "right" as const, grid: { drawOnChartArea: false }, ticks: { color: "#9ca3af" } },
    },
  };

  return (
    <div className={className}>
      <div className="h-[300px]">
        <Line id={chartId} data={data} options={options} />
      </div>
    </div>
  );
}


