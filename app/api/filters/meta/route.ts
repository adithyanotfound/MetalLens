import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const statesRows = await prisma.groundwater_quality.findMany({ distinct: ["state_name"], select: { state_name: true } });
    const agenciesRows = await prisma.groundwater_quality.findMany({ distinct: ["agency_name"], select: { agency_name: true } });
    const yearsRows = await prisma.groundwater_quality.findMany({ distinct: ["date_collected"], select: { date_collected: true } });

    const states = statesRows.map((r) => r.state_name).filter(Boolean);
    const agencies = agenciesRows.map((r) => r.agency_name).filter(Boolean);
    const years = yearsRows
      .map((r) => (r.date_collected ? new Date(r.date_collected).getFullYear() : null))
      .filter((x): x is number => x !== null);

    const uniqueYears = Array.from(new Set(years)).sort();

    return NextResponse.json({ states, agencies, years: uniqueYears });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "meta error" }, { status: 500 });
  }
}
