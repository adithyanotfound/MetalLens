import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idStr = id ?? new URL(req.url).searchParams.get("id");
    const stationId = Number(idStr);
    if (Number.isNaN(stationId)) return NextResponse.json({ rows: [] });

    // Look up the clicked record to get the station identity (station_name)
    const rec = await prisma.groundwater_quality.findUnique({
      where: { id: stationId },
      select: { station_name: true },
    });
    if (!rec?.station_name) return NextResponse.json({ rows: [] });

    // Return all rows for that station ordered by date
    // Prisma cannot handle NaN in Float fields. Use $queryRaw to get raw data and sanitize.
    const rowsRaw: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, station_name, date_collected, hpi, hei,
              "As", "Cd", "Cr", "Cu", "Fe", "Pb", "Mn", "Hg", "Ni", "Zn", "Se", "Al", "Ba", "Ag", "B", "U"
       FROM "groundwater_quality"
       WHERE station_name = $1
       ORDER BY date_collected ASC
       LIMIT 1000`,
      rec.station_name as any
    );
    const sanitize = (v: any) => (typeof v === "number" && Number.isNaN(v) ? null : v);
    const rows = rowsRaw.map((r: any) => ({
      ...r,
      As: sanitize(r.As), Cd: sanitize(r.Cd), Cr: sanitize(r.Cr), Cu: sanitize(r.Cu), Fe: sanitize(r.Fe),
      Pb: sanitize(r.Pb), Mn: sanitize(r.Mn), Hg: sanitize(r.Hg), Ni: sanitize(r.Ni), Zn: sanitize(r.Zn),
      Se: sanitize(r.Se), Al: sanitize(r.Al), Ba: sanitize(r.Ba), Ag: sanitize(r.Ag), B: sanitize(r.B), U: sanitize(r.U),
    }));
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}


