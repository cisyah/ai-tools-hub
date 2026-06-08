import { error, ok, serverError } from "@/lib/api";
import { fetchUrlMetadata } from "@/lib/preview";
import { isValidUrl } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url || !isValidUrl(url)) {
      return error("URL 只支持 http(s):// 或站内 /path。");
    }

    const metadata = await fetchUrlMetadata(url);
    return ok({ metadata });
  } catch (err) {
    return serverError(err);
  }
}
