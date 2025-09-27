import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const revalidate = 1800; // cache 30 minutes
export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");

    const selects: string[] = [
      `EXTRACT(YEAR FROM date_collected)::int AS year`,
      `AVG(NULLIF(hpi::text, 'NaN')::float) AS hpi`,
      `AVG(NULLIF(hei::text, 'NaN')::float) AS hei`,
      ...METAL_COLS.map((c) => `AVG(NULLIF("${c}"::text, 'NaN')::float) AS "${c}"`),
    ];

    const clauses: string[] = [
      `date_collected IS NOT NULL`,
    ];
    const params: unknown[] = [];
    let idx = 1;
    if (state) {
      clauses.push(`state_name = $${idx++}`);
      params.push(state);
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const sql = `
      SELECT ${selects.join(", ")}
      FROM groundwater_quality
      ${whereClause}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const rows: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(sql, ...params);

    const mapped = rows.map((r) => ({
      date_collected: new Date(Number(r.year), 0, 1).toISOString(),
      hpi: r.hpi ?? null,
      hei: r.hei ?? null,
      ...Object.fromEntries(METAL_COLS.map((c) => [c, r[c] ?? null])),
    }));

    return NextResponse.json({ rows: mapped });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message ?? "aggregate error" }, { status: 500 });
  }
}


