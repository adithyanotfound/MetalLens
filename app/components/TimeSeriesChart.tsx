"use client";
import { useMemo, useRef } from "react";
import ParameterLineChart from "./ParameterLineChart";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

type Row = Record<string, any> & { date_collected?: string | Date };

const METAL_COLS = [
  "As",
  "Cd",
  "Cr",
  "Cu",
  "Fe",
  "Pb",
  "Mn",
  "Hg",
  "Ni",
  "Zn",
  "Se",
  "Al",
  "Ba",
  "Ag",
  "B",
  "U",
];

const COLORS = [
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#84cc16",
  "#f43f5e",
  "#0ea5e9",
  "#eab308",
  "#fb7185",
  "#65a30d",
  "#06b6d4",
];

type Props = {
  rows: Row[];
};

export default function TimeSeriesChart({ rows }: Props) {
  const chartRef = useRef<ChartJSOrUndefined<"line">>(null);

  const { labels, datasets } = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2015 + i);
    const resultLabels: (string | number)[] = years;

    const series: Array<{ label: string; data: number[]; color: string; yAxisID?: string }> = [];

    const aggregate = (col: string) => {
      return years.map((yr) => {
        const vals = rows
          .filter((r) => {
            const d = r.date_collected ? new Date(r.date_collected) : null;
            return d && d.getFullYear() === yr && typeof r[col] === "number" && !Number.isNaN(r[col]);
          })
          .map((r) => Number(r[col]));
        if (!vals.length) return 0;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      });
    };

    // HPI & HEI
    const hpiData = aggregate("hpi");
    const heiData = aggregate("hei");
    series.push({ label: "HPI", data: hpiData, color: COLORS[0], yAxisID: "y" });
    series.push({ label: "HEI", data: heiData, color: COLORS[1], yAxisID: "y2" });

    let colorIdx = 2;
    METAL_COLS.forEach((col) => {
      const dataArr = aggregate(col);
      if (dataArr.some((v) => v !== null)) {
        series.push({ label: col, data: dataArr, color: COLORS[colorIdx % COLORS.length], yAxisID: "y" });
        colorIdx++;
      }
    });

    return { labels: resultLabels, datasets: series };
  }, [rows]);

  const optionsDownload = () => {
    const url = chartRef.current?.toBase64Image();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = "chart.png";
    link.click();
  };

  return (
    <div className="bg-[#0b0f17] rounded p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">Station Parameters Over Time</div>
        <button onClick={optionsDownload} className="text-xs opacity-70 hover:opacity-100">
          Download PNG
        </button>
      </div>
      <ParameterLineChart
        chartId="station-timeseries"
        labels={labels}
        series={datasets.map((d) => ({ ...d, pointRadius: 0 }))}
        className="h-[300px]"
      />
    </div>
  );
}
