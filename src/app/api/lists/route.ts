import { error, ok, serverError } from "@/lib/api";
import { createList, listLists } from "@/lib/queries/lists";
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
