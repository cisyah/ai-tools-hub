import { NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Token",
  "Access-Control-Max-Age": "86400",
};

export function corsHeaders(): Record<string, string> {
  return { ...CORS_HEADERS };
}

export function withCors<T extends Response>(response: T): T {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function handleOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function getConfiguredToken(): string {
  return (process.env.EXTENSION_API_TOKEN ?? "").trim();
}

function extractToken(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return (request.headers.get("x-api-token") ?? "").trim();
}

function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) {
    return site === "same-origin" || site === "none";
  }

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/**
 * Plan B: reads are public, writes are protected.
 * Same-origin writes (the web admin UI) pass through unchanged.
 * Cross-origin writes (the browser extension) must present a valid token.
 * If EXTENSION_API_TOKEN is not configured, enforcement is skipped (local dev).
 */
export function checkWriteAuth(request: Request): NextResponse | null {
  const configured = getConfiguredToken();
  if (!configured) return null;
  if (isSameOriginRequest(request)) return null;

  const provided = extractToken(request);
  if (provided && provided === configured) return null;

  return withCors(NextResponse.json({ error: "未授权：缺少或无效的 API Token。" }, { status: 401 }));
}
