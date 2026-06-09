import { error, ok, serverError } from "@/lib/api";
import { createList, listLists, reorderLists } from "@/lib/queries/lists";
import { parseListInput } from "@/lib/validation";

export async function GET() {
  try {
    const lists = await listLists();
    return ok({ lists });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseListInput(await request.json());
    const list = await createList(input);
    return ok({ list });
  } catch (err) {
    if (err instanceof Error) return error(err.message);
    return serverError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const listIds =
      body && typeof body === "object" && Array.isArray((body as { listIds?: unknown }).listIds)
        ? (body as { listIds: unknown[] }).listIds
        : [];
    if (!listIds.length || !listIds.every((id) => typeof id === "string" && id.trim())) {
      return error("列表排序数据不正确。");
    }

    const lists = await reorderLists(listIds.map((id) => String(id)));
    return ok({ lists });
  } catch (err) {
    if (err instanceof Error) return error(err.message);
    return serverError(err);
  }
}
