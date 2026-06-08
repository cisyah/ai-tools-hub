import { error, ok, serverError } from "@/lib/api";
import { mergeListIntoList } from "@/lib/queries/lists";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const targetListId = typeof body.targetListId === "string" ? body.targetListId.trim() : "";

    if (!targetListId) return error("请选择目标列表。");

    const result = await mergeListIntoList(id, targetListId);
    return ok(result);
  } catch (err) {
    if (err instanceof Error) return error(err.message);
    return serverError(err);
  }
}
