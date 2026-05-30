import type { NextRequest } from "next/server";
import { fetchScreener } from "@/lib/pmxt/queries";
import type { Relation } from "@/lib/pmxt/types";
import { ok, fail } from "@/lib/pmxt/respond";

const RELATIONS = new Set<Relation>([
  "identity",
  "subset",
  "superset",
  "overlap",
  "complement",
  "disjoint",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const relationParam = params.get("relation");
  const relation =
    relationParam && RELATIONS.has(relationParam as Relation)
      ? (relationParam as Relation)
      : undefined;
  const sortParam = params.get("sort");
  const sort = sortParam === "confidence" ? "confidence" : "volume";

  try {
    const { data, fetchedAt } = await fetchScreener({
      relation,
      sort,
      minVenues: Number(params.get("minVenues")) || 2,
      minConfidence: params.get("minConfidence")
        ? Number(params.get("minConfidence"))
        : undefined,
      query: params.get("q")?.trim() || undefined,
      limit: Number(params.get("limit")) || 50,
    });
    return ok({ clusters: data }, fetchedAt);
  } catch (err) {
    return fail(err);
  }
}
