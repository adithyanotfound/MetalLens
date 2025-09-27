import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { Parser } from "json2csv";

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

export const revalidate = 600; // cache 10 minutes
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || undefined;
    const district = searchParams.get("district") || undefined;
    const agency = searchParams.get("agency") || undefined;
    const startYear = searchParams.get("startYear") ? Number(searchParams.get("startYear")) : undefined;
    const endYear = searchParams.get("endYear") ? Number(searchParams.get("endYear")) : undefined;

    const where: Record<string, unknown> = {};
    if (state) where.state_name = state;
    if (district) where.district_name = district;
    if (agency) where.agency_name = agency;
    if (startYear || endYear) {
      const dateFilter: Record<string, Date> = {};
      if (startYear) dateFilter.gte = new Date(`${startYear}-01-01`);
      if (endYear) dateFilter.lte = new Date(`${endYear}-12-31`);
      where.date_collected = dateFilter;
    }

    // Build raw SQL to coalesce NaN to NULL so Prisma driver can handle it
    const selectCols = [
      "id",
      "station_name",
      "agency_name",
      "state_name",
      "district_name",
      "date_collected",
      "latitude",
      "longitude",
      "hpi",
      "hei",
      "completeness",
      ...METAL_COLS,
    ];

    const selectFrag = selectCols
      .map((c) => (METAL_COLS.includes(c) ? `NULLIF("${c}", 'NaN')::float AS "${c}"` : `"${c}"`))
      .join(", ");

    // Build WHERE clause with parameters
    const clauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (state) {
      clauses.push(`state_name = $${idx++}`);
      params.push(state);
    }
    if (district) {
      clauses.push(`district_name = $${idx++}`);
      params.push(district);
    }
    if (agency) {
      clauses.push(`agency_name = $${idx++}`);
      params.push(agency);
    }
    if (startYear) {
      clauses.push(`date_collected >= $${idx++}::date`);
      params.push(`${startYear}-01-01`);
    }
    if (endYear) {
      clauses.push(`date_collected <= $${idx++}::date`);
      params.push(`${endYear}-12-31`);
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const sql = `SELECT ${selectFrag} FROM groundwater_quality ${whereClause} LIMIT 50000`;
    const rows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(sql, ...params);

    // Replace null with blank for metals columns for CSV readability
    const cleaned = rows.map((r) => {
      const obj: Record<string, unknown> = { ...r };
      METAL_COLS.forEach((col) => {
        if (obj[col] === null || Number.isNaN(obj[col])) obj[col] = "";
      });
      return obj;
    });

    const parser = new Parser();
    const csv = parser.parse(cleaned);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=export.csv",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message ?? "export error" }, { status: 500 });
  }
}
