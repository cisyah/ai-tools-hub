import { error, ok, serverError } from "@/lib/api";
import { checkWriteAuth, handleOptions, withCors } from "@/lib/extension-auth";
import { assertKnownCardType } from "@/lib/queries/card-types";
import { createCard, listCards, reorderCards } from "@/lib/queries/cards";
import { parseCardInput } from "@/lib/validation";

export function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get("includeArchived") === "1";
    const cards = await listCards(includeArchived);
    return withCors(ok({ cards }));
  } catch (err) {
    return withCors(serverError(err));
  }
}

export async function POST(request: Request) {
  const unauthorized = checkWriteAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const input = parseCardInput(await request.json());
    await assertKnownCardType(input.type);
    const card = await createCard(input);
    return withCors(ok({ card }));
  } catch (err) {
    if (err instanceof Error) return withCors(error(err.message));
    return withCors(serverError(err));
  }
}

export async function PATCH(request: Request) {
  const unauthorized = checkWriteAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const cardIds =
      body && typeof body === "object" && Array.isArray((body as { cardIds?: unknown }).cardIds)
        ? (body as { cardIds: unknown[] }).cardIds
        : [];
    if (!cardIds.length || !cardIds.every((id) => typeof id === "string" && id.trim())) {
      return withCors(error("卡片排序数据不正确。"));
    }

    const cards = await reorderCards(cardIds.map((id) => String(id)));
    return withCors(ok({ cards }));
  } catch (err) {
    if (err instanceof Error) return withCors(error(err.message));
    return withCors(serverError(err));
  }
}
