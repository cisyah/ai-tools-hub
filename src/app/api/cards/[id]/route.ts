import { error, ok, serverError } from "@/lib/api";
import { deleteCard, getCard, setCardArchiveState, setCardFavoriteState, updateCard } from "@/lib/queries/cards";
import { parseCardInput } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const card = await getCard(id);
    if (!card) return error("卡片不存在。", 404);
    return ok({ card });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body && typeof body === "object" && "isArchived" in body && Object.keys(body).length === 1) {
      const card = await setCardArchiveState(id, Boolean((body as { isArchived: unknown }).isArchived));
      return ok({ card });
    }

    if (body && typeof body === "object" && "isFavorite" in body && Object.keys(body).length === 1) {
      const card = await setCardFavoriteState(id, Boolean((body as { isFavorite: unknown }).isFavorite));
      return ok({ card });
    }

    const input = parseCardInput(body);
    const card = await updateCard(id, input);
    return ok({ card });
  } catch (err) {
    if (err instanceof Error) return error(err.message);
    return serverError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteCard(id);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
