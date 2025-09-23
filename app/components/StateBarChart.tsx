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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  className?: string;
};

export default function StateBarChart({ className }: Props) {
  const labels = [
    "Andhra Pradesh",
    "Assam",
    "Bihar",
    "Gujarat",
    "Karnataka",
    "Maharashtra",
    "Rajasthan",
    "Tamil Nadu",
    "Uttar Pradesh",
    "West Bengal",
  ];
  const totals = labels.map((_, i) => 300 + (i % 5) * 200);
  const monitored = labels.map((_, i) => totals[i] - 50 - (i % 4) * 30);

  const data = {
    labels,
    datasets: [
      {
        label: "Total Stations",
        data: totals,
        backgroundColor: "rgba(59,130,246,0.6)",
      },
      {
        label: "Total Monitored Stations",
        data: monitored,
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


