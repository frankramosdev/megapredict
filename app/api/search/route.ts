import type { NextRequest } from "next/server";
import { searchMarkets, searchEvents } from "@/lib/pmxt/queries";
import { ok, fail } from "@/lib/pmxt/respond";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim() ?? "";
  const type = params.get("type") === "event" ? "event" : "market";
  const limit = Number(params.get("limit")) || undefined;

  try {
    if (type === "event") {
      const { data, fetchedAt } = await searchEvents(query, limit ?? 18);
      return ok({ type, results: data }, fetchedAt);
    }
    const { data, fetchedAt } = await searchMarkets(query, limit ?? 24);
    return ok({ type, results: data }, fetchedAt);
  } catch (err) {
    return fail(err);
  }
}
