import { error, ok, serverError } from "@/lib/api";
import { assertKnownCardType } from "@/lib/queries/card-types";
import { createCard, listCards } from "@/lib/queries/cards";
import { parseCardInput } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get("includeArchived") === "1";
    const cards = await listCards(includeArchived);
    return ok({ cards });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseCardInput(await request.json());
    await assertKnownCardType(input.type);
    const card = await createCard(input);
    return ok({ card });
  } catch (err) {
    if (err instanceof Error) return error(err.message);
    return serverError(err);
  }
}
