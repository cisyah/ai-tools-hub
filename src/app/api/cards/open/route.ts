import { error, ok, serverError } from "@/lib/api";
import { recordOpenEvent } from "@/lib/queries/cards";
import { parseOpenEventInput } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = parseOpenEventInput(await request.json());
    await recordOpenEvent(input);
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof Error) return error(err.message);
    return serverError(err);
  }
}
