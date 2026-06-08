import { ok, serverError } from "@/lib/api";
import { addCardToList, removeCardFromList } from "@/lib/queries/lists";

type RouteContext = {
  params: Promise<{ id: string; cardId: string }>;
};

export async function PUT(_request: Request, context: RouteContext) {
  try {
    const { id, cardId } = await context.params;
    await addCardToList(id, cardId);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, cardId } = await context.params;
    await removeCardFromList(id, cardId);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
