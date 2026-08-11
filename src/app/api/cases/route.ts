import { NextRequest, NextResponse } from "next/server";
import { getCases, createCase } from "@/lib/db";

export async function GET() {
  const cases = await getCases();
  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.caseNumber || !body.title || !body.court || !body.filingDate) {
    return NextResponse.json(
      { error: "caseNumber, title, court, and filingDate are required" },
      { status: 400 }
    );
  }

  const created = await createCase({
    caseNumber: body.caseNumber,
    title: body.title,
    court: body.court,
    filingDate: body.filingDate,
    caseType: body.caseType ?? "Civil Suit",
    counselFor: body.counselFor ?? "",
    stage: body.stage ?? "Filed",
    status: body.status ?? "Active",
    priority: body.priority ?? "Medium",
    parties: body.parties ?? [],
  });

  return NextResponse.json(created, { status: 201 });
}
