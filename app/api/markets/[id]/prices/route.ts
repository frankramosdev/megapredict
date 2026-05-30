import { fetchMarketPrices } from "@/lib/pmxt/queries";
import { ok, fail } from "@/lib/pmxt/respond";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { data, fetchedAt } = await fetchMarketPrices(decodeURIComponent(id));
    return ok({ prices: data }, fetchedAt, "prices");
  } catch (err) {
    return fail(err);
  }
}
