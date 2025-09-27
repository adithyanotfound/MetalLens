import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const revalidate = 3600; // cache for 1 hour
export const runtime = "nodejs";

export async function GET() {
  try {
    const rows: Array<{ states: string[]; agencies: string[]; years: number[] }> = await prisma.$queryRawUnsafe(
      `
        SELECT
          ARRAY(
            SELECT DISTINCT state_name
            FROM groundwater_quality
            WHERE state_name IS NOT NULL
            ORDER BY state_name
          ) AS states,
          ARRAY(
            SELECT DISTINCT agency_name
            FROM groundwater_quality
            WHERE agency_name IS NOT NULL
            ORDER BY agency_name
          ) AS agencies,
          ARRAY(
            SELECT DISTINCT EXTRACT(YEAR FROM date_collected)::int
            FROM groundwater_quality
            WHERE date_collected IS NOT NULL
            ORDER BY 1
          ) AS years
      `
    );

    const row = rows[0] ?? { states: [], agencies: [], years: [] };
    return NextResponse.json({ states: row.states, agencies: row.agencies, years: row.years });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "meta error" }, { status: 500 });
  }
}
