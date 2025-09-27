import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const state = url.searchParams.get("state");

    if (state) {
      // District-wise counts within a state based on unique lat/lng
      const totals = await prisma.$queryRawUnsafe<{ district_name: string | null; cnt: bigint }[]>(
        `SELECT district_name, COUNT(*)::bigint AS cnt
         FROM (
           SELECT DISTINCT district_name, latitude, longitude
           FROM groundwater_quality
           WHERE state_name = $1 AND latitude IS NOT NULL AND longitude IS NOT NULL
         ) t
         GROUP BY district_name
         ORDER BY cnt DESC, district_name ASC`,
        state as any
      );

      const monitored = await prisma.$queryRawUnsafe<{ district_name: string | null; cnt: bigint }[]>(
        `SELECT district_name, COUNT(*)::bigint AS cnt
         FROM (
           SELECT DISTINCT district_name, latitude, longitude
           FROM groundwater_quality
           WHERE state_name = $1 AND completeness = 'Monitored' AND latitude IS NOT NULL AND longitude IS NOT NULL
         ) t
         GROUP BY district_name
         ORDER BY cnt DESC, district_name ASC`,
        state as any
      );

      const monitoredMap = Object.fromEntries(monitored.map((m) => [m.district_name ?? "Unknown", Number(m.cnt)]));

      const rows = totals.map((t) => ({
        district: t.district_name ?? "Unknown",
        total: Number(t.cnt),
        monitored: monitoredMap[t.district_name ?? "Unknown"] ?? 0,
      }));
      return NextResponse.json({ rows });
    }

    // total station counts per state
    const totals = await prisma.$queryRawUnsafe<{ state_name: string | null; cnt: bigint }[]>(
      "SELECT state_name, COUNT(*)::bigint AS cnt FROM (SELECT DISTINCT state_name, latitude, longitude FROM groundwater_quality WHERE latitude IS NOT NULL AND longitude IS NOT NULL) t GROUP BY state_name"
    );

    // monitored counts where completeness === "Monitored"
    const monitored = await prisma.$queryRawUnsafe<{ state_name: string | null; cnt: bigint }[]>(
      "SELECT state_name, COUNT(*)::bigint AS cnt FROM (SELECT DISTINCT state_name, latitude, longitude FROM groundwater_quality WHERE completeness = 'Monitored' AND latitude IS NOT NULL AND longitude IS NOT NULL) t GROUP BY state_name"
    );

    const monitoredMap = Object.fromEntries(monitored.map((m) => [m.state_name ?? "Unknown", Number(m.cnt)]));

    const rows = totals.map((t) => ({
      state: t.state_name ?? "Unknown",
      total: Number(t.cnt),
      monitored: monitoredMap[t.state_name ?? "Unknown"] ?? 0,
    }));
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error in /api/stations/state-count" }, { status: 500 });
  }
}
