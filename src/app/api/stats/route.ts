import { ok, serverError } from "@/lib/api";
import { getStats } from "@/lib/queries/cards";

export async function GET() {
  try {
    const stats = await getStats();
    return ok({ stats });
  } catch (err) {
    return serverError(err);
  }
}
