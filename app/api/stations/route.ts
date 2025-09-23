import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ensure Prisma runs on Node runtime

export async function GET() {
  try {
    // Using the introspected model groundwater_quality as stations source
    const rows = await prisma.groundwater_quality.findMany({
      select: { id: true, station_name: true, latitude: true, longitude: true },
      orderBy: [{ station_name: "asc" }],
      take: 20000,
    });
    const mapped = rows
      .filter((r: { latitude: number | null; longitude: number | null }) => r.latitude !== null && r.longitude !== null)
      .map((r: { id: number; station_name: string | null; latitude: number; longitude: number }) => ({ id: r.id, name: r.station_name ?? "Station", lat: r.latitude, lng: r.longitude }));
    return NextResponse.json({ rows: mapped });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error in /api/stations" }, { status: 500 });
  }
}


