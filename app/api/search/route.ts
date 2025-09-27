import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ results: [] });

    const stationRows = await prisma.groundwater_quality.findMany({
      where: { station_name: { contains: q, mode: "insensitive" } },
      select: { id: true, station_name: true, latitude: true, longitude: true },
      distinct: ["latitude", "longitude"],
      take: 10,
    });

    // State matches with approximate center (avg of unique lat/lng pairs in that state)
    const stateRows: Array<{ state_name: string | null; lat: number | null; lng: number | null }> =
      await prisma.$queryRawUnsafe(
        `SELECT state_name,
                AVG(latitude)::float AS lat,
                AVG(longitude)::float AS lng
         FROM (
           SELECT DISTINCT state_name, latitude, longitude
           FROM groundwater_quality
           WHERE state_name ILIKE $1 AND latitude IS NOT NULL AND longitude IS NOT NULL
         ) t
         GROUP BY state_name
         ORDER BY state_name
         LIMIT 10`,
        `%${q}%` as any
      );

    const results = [
      ...stateRows.map((r) => ({ type: "state", name: r.state_name, state: r.state_name, lat: r.lat, lng: r.lng })),
      ...stationRows.map((r) => ({ type: "station", id: r.id, name: r.station_name, lat: r.latitude, lng: r.longitude })),
    ];
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "search error" }, { status: 500 });
  }
}
