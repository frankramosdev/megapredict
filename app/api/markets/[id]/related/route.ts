import { fetchRelated } from "@/lib/pmxt/queries";
import { ok, fail } from "@/lib/pmxt/respond";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { data, fetchedAt } = await fetchRelated(decodeURIComponent(id));
    return ok({ related: data }, fetchedAt, "related");
  } catch (err) {
    return fail(err);
  }
}
