import { error, ok, serverError } from "@/lib/api";
import { createCardType, deleteCardType, listCardTypeUsage, renameCardType } from "@/lib/queries/card-types";

function cleanLabel(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const types = await listCardTypeUsage(true);
    return ok({ types });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const label = cleanLabel(body.label);
    if (!label) return error("应用类型名称不能为空。");

    const type = await createCardType(label);
    return ok({ type });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = cleanId(body.id);
    const label = cleanLabel(body.label);
    if (!id || !label) return error("应用类型信息不完整。");

    await renameCardType(id, label);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = cleanId(url.searchParams.get("id"));
    if (!id) return error("应用类型 id 不能为空。");

    await deleteCardType(id);
    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
