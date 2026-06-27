import { NextRequest, NextResponse } from "next/server";
import { createTriageDecision } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      companyId: number;
      action: string;
      notes?: string;
    };

    if (!body.companyId || !body.action) {
      return NextResponse.json(
        { error: "companyId and action are required" },
        { status: 400 }
      );
    }

    if (!["interested", "pass", "snooze"].includes(body.action)) {
      return NextResponse.json(
        { error: "action must be interested, pass, or snooze" },
        { status: 400 }
      );
    }

    await createTriageDecision(body.companyId, body.action, undefined, body.notes);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to create triage decision: ${err}` },
      { status: 500 }
    );
  }
}
