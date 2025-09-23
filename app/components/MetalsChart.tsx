"use client";

import ParameterLineChart from "./ParameterLineChart";

type Row = Record<string, any> & { date_collected?: string | Date };

const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#14b8a6", "#eab308", "#f97316", "#06b6d4", "#84cc16", "#f43f5e", "#10b981", "#8b5cf6", "#fb7185", "#65a30d", "#0ea5e9"];

const METAL_KEYS = ["As","Cd","Cr","Cu","Fe","Pb","Mn","Hg","Ni","Zn","Se","Al","Ba","Ag","B","U"] as const;

type Props = {
  rows: Row[];
};

export default function MetalsChart({ rows }: Props) {
  const labels = rows.map((r) => r.date_collected ?? "");
  const series = METAL_KEYS.map((key, idx) => ({
    label: key,
    data: rows.map((r) => (typeof r[key] === "number" ? Number(r[key]) : null)),
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <ParameterLineChart labels={labels} series={series} useTimeAxis />
  );
}


