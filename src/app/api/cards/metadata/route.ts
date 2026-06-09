import { error, ok, serverError } from "@/lib/api";
import { checkWriteAuth, handleOptions, withCors } from "@/lib/extension-auth";
import { fetchUrlMetadata } from "@/lib/preview";
import { isValidUrl } from "@/lib/validation";

export function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  const unauthorized = checkWriteAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url || !isValidUrl(url)) {
      return withCors(error("URL 只支持 http(s):// 或站内 /path。"));
    }

    const metadata = await fetchUrlMetadata(url);
    return withCors(ok({ metadata }));
  } catch (err) {
    return withCors(serverError(err));
  }
}
