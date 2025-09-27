import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*)::bigint AS count FROM (SELECT DISTINCT latitude, longitude FROM groundwater_quality WHERE latitude IS NOT NULL AND longitude IS NOT NULL) t"
    );
    const count = Number(result[0]?.count ?? 0);
    return NextResponse.json({ count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error in /api/stations/count" }, { status: 500 });
  }
}
