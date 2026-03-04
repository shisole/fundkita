import { createClient } from "@/lib/supabase/server";

const EXCHANGE_RATE_API_URL =
  process.env.EXCHANGE_RATE_API_URL ?? "https://open.er-api.com/v6/latest/USD";

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

interface ExchangeRateResult {
  rate: number;
  fetchedAt: string;
}

interface ExternalApiResponse {
  result: string;
  rates: Record<string, number>;
}

/**
 * Get the current USD → PHP exchange rate.
 *
 * Strategy:
 * 1. Check Supabase `exchange_rates` table for a cached rate less than 1 hour old.
 * 2. If stale or missing, fetch from the external API and upsert.
 * 3. If the external API fails and a stale cached rate exists, return it (with a warning).
 * 4. If no cached rate and the API fails, throw an error.
 */
export async function getExchangeRate(): Promise<ExchangeRateResult> {
  const supabase = await createClient();

  // ── 1. Check for a cached rate ───────────────────────────────────────────────
  const { data: cached } = await supabase
    .from("exchange_rates")
    .select("rate, fetched_at")
    .eq("from_currency", "USD")
    .eq("to_currency", "PHP")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_MAX_AGE_MS) {
      return { rate: cached.rate, fetchedAt: cached.fetched_at };
    }
  }

  // ── 2. Fetch from external API ───────────────────────────────────────────────
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${String(response.status)}`);
    }

    const data = (await response.json()) as ExternalApiResponse;
    const phpRate = data.rates.PHP;

    if (typeof phpRate !== "number") {
      throw new TypeError("PHP rate not found in API response");
    }

    const now = new Date().toISOString();

    // Upsert into cache
    await supabase.from("exchange_rates").upsert(
      {
        from_currency: "USD",
        to_currency: "PHP",
        rate: phpRate,
        fetched_at: now,
      },
      { onConflict: "from_currency,to_currency" },
    );

    return { rate: phpRate, fetchedAt: now };
  } catch (error) {
    // ── 3. Fallback to stale cache if available ────────────────────────────────
    if (cached) {
      console.warn(
        "[exchange-rate] External API failed, returning stale cached rate:",
        error instanceof Error ? error.message : error,
      );
      return { rate: cached.rate, fetchedAt: cached.fetched_at };
    }

    // ── 4. No cache and API failed — throw ─────────────────────────────────────
    throw new Error(
      `Failed to fetch exchange rate and no cached rate available: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
