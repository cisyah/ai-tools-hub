import { error, ok, serverError } from "@/lib/api";
import { deleteList, getCardsForList, getList, updateList } from "@/lib/queries/lists";
import { parseListInput } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const list = await getList(id);
    if (!list) return error("列表不存在。", 404);
    const cards = await getCardsForList(list);
    return ok({ list, cards });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = parseListInput(await request.json());
    const list = await updateList(id, input);
    return ok({ list });
  } catch (err) {
    if (err instanceof Error) return error(err.message);
    return serverError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteList(id);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
