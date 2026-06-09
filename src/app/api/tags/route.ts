import { error, ok, serverError } from "@/lib/api";
import { createTag, deleteTag, listTagCounts, renameTag } from "@/lib/queries/cards";

function cleanTag(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get("includeArchived") === "1";
    const tags = await listTagCounts(includeArchived);
    return ok({ tags });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = cleanTag(body.name);
    if (!name) return error("标签名称不能为空。");

    await createTag(name);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const oldName = cleanTag(body.oldName);
    const newName = cleanTag(body.newName);

    if (!oldName || !newName) return error("标签名称不能为空。");

    await renameTag(oldName, newName);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const name = cleanTag(url.searchParams.get("name"));
    if (!name) return error("标签名称不能为空。");

    await deleteTag(name);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
