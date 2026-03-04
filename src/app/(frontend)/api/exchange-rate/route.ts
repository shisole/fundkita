import { NextResponse } from "next/server";

import { getExchangeRate } from "@/lib/utils/exchange-rate";

export async function GET() {
  try {
    const { rate, fetchedAt } = await getExchangeRate();

    return NextResponse.json(
      { usd_to_php: rate, fetched_at: fetchedAt },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch exchange rate" },
      { status: 500 },
    );
  }
}
