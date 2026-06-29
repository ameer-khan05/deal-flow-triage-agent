import { NextRequest, NextResponse } from "next/server";
import { createTriageDecision } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    let companyId: number;
    let action: string;
    let notes: string | undefined;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        companyId: number;
        action: string;
        notes?: string;
      };
      companyId = body.companyId;
      action = body.action;
      notes = body.notes;
    } else {
      const formData = await request.formData();
      companyId = Number(formData.get("companyId"));
      action = String(formData.get("action") ?? "");
      const formNotes = formData.get("notes");
      notes = formNotes ? String(formNotes) : undefined;
    }

    if (!companyId || !action) {
      return NextResponse.json(
        { error: "companyId and action are required" },
        { status: 400 }
      );
    }

    if (!["interested", "pass", "snooze"].includes(action)) {
      return NextResponse.json(
        { error: "action must be interested, pass, or snooze" },
        { status: 400 }
      );
    }

    await createTriageDecision(companyId, action, undefined, notes);

    return NextResponse.redirect(new URL(`/company/${companyId}`, request.url));
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to create triage decision: ${err}` },
      { status: 500 }
    );
  }
}
