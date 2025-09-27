"use client";

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

type Props = {
  rows: Row[];
};

export default function DataPreview({ rows }: Props) {
  const keys = ["hpi", "hei", ...METAL_COLS];
  return (
    <div className="bg-[#0b0f17] rounded p-3 max-h-[260px] overflow-auto">
      <div className="text-sm font-medium mb-2">Data Preview</div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left opacity-70">
            <th className="px-2 py-1">Date</th>
            {keys.map((k) => (
              <th key={k} className="px-2 py-1 capitalize">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((r, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="px-2 py-1">{String(r.date_collected ?? "").slice(0, 10)}</td>
              {keys.map((k) => (
                <td key={k} className="px-2 py-1">
                  {r[k] ?? ""}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-2 py-2 opacity-60" colSpan={keys.length + 1}>
                No records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
