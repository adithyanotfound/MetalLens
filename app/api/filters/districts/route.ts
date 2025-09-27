import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const revalidate = 3600;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    if (!state) return NextResponse.json({ error: "state required" }, { status: 400 });

    const rows = await prisma.groundwater_quality.findMany({
      where: { state_name: state },
      distinct: ["district_name"],
      select: { district_name: true },
      take: 10000,
    });
    const districts = rows.map((r) => r.district_name).filter(Boolean);
    return NextResponse.json({ districts });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message ?? "districts error" }, { status: 500 });
  }
}
