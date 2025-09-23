import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

// Attempts to find a table with columns named like hpi and hei (case-insensitive)
async function findHpiHeiTable() {
  const rows: Array<{ table_schema: string; table_name: string }> = await prisma.$queryRawUnsafe(
    `
      SELECT table_schema, table_name
      FROM information_schema.columns
      WHERE lower(column_name) IN ('hpi', 'hei')
      GROUP BY table_schema, table_name
      HAVING COUNT(DISTINCT lower(column_name)) = 2
      ORDER BY table_schema, table_name
      LIMIT 1;
    `
  );
  return rows[0];
}

export async function GET() {
  try {
    const match = await findHpiHeiTable();
    if (!match) {
      return NextResponse.json({ error: "No table with columns hpi and hei found." }, { status: 404 });
    }
    const fqtn = `"${match.table_schema}"."${match.table_name}"`;
    const data = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM ${fqtn} LIMIT 500;`);

    // Build simple KPIs if present
    const numeric = data.filter((r) => typeof r.hpi === "number" && typeof r.hei === "number");
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const response = {
      table: match,
      count: data.length,
      averageHpi: avg(numeric.map((r) => r.hpi)),
      averageHei: avg(numeric.map((r) => r.hei)),
      rows: data,
    };
    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}


