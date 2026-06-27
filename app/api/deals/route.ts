import { NextRequest, NextResponse } from "next/server";
import { getDealFeed } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const deals = await getDealFeed({
      sector: searchParams.get("sector") ?? undefined,
      minScore: searchParams.get("minScore")
        ? Number(searchParams.get("minScore"))
        : undefined,
      stage: searchParams.get("stage") ?? undefined,
      signalType: searchParams.get("signalType") ?? undefined,
    });

    return NextResponse.json(deals);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch deals: ${err}` },
      { status: 500 }
    );
  }
}
