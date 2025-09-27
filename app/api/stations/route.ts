import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const revalidate = 3600; // cache for 1 hour to speed up initial load
export const runtime = "nodejs"; // ensure Prisma runs on Node runtime

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const yearStr = url.searchParams.get("year");
    const year = yearStr ? Number(yearStr) : undefined;

    // Return distinct station points by unique latitude/longitude to avoid duplicates
    // If year is provided, compute average HPI/HEI for that year per station (lat/lng group)
    const params: any[] = [];
    let yearClause = "";
    if (typeof year === "number" && !Number.isNaN(year)) {
      params.push(year);
      yearClause = "AND EXTRACT(YEAR FROM date_collected)::int = $1";
    }

    let sql = `
      SELECT
        MIN(id)::int AS id,
        COALESCE(MAX(station_name), 'Station') AS station_name,
        latitude::float AS lat,
        longitude::float AS lng,
        AVG(NULLIF(hpi::text, 'NaN')::float) AS hpi,
        AVG(NULLIF(hei::text, 'NaN')::float) AS hei
      FROM groundwater_quality
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ${yearClause}
      GROUP BY latitude, longitude
      LIMIT 25000
    `;
    const rows: Array<{ id: number; station_name: string | null; lat: number; lng: number; hpi: number | null; hei: number | null }> =
      await prisma.$queryRawUnsafe(sql, ...params);

    const mapped = rows.map((r) => ({ id: r.id, name: r.station_name ?? "Station", lat: r.lat, lng: r.lng, hpi: r.hpi ?? null, hei: r.hei ?? null }));
    return NextResponse.json({ rows: mapped });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error in /api/stations" }, { status: 500 });
  }
}


