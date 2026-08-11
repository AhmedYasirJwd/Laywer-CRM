import { NextRequest, NextResponse } from "next/server";
import { getHearings, createHearing } from "@/lib/db";

export async function GET() {
  const hearings = await getHearings();
  return NextResponse.json(hearings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.caseId || !body.date || !body.purpose || !body.court) {
    return NextResponse.json(
      { error: "caseId, date, purpose, and court are required" },
      { status: 400 }
    );
  }

  const created = await createHearing({
    caseId: body.caseId,
    date: body.date,
    purpose: body.purpose,
    court: body.court,
    counselFor: body.counselFor,
  });

  return NextResponse.json(created, { status: 201 });
}
