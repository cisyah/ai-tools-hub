import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "api.microlink.io",
  "i.ytimg.com",
  "img.youtube.com",
  "pbs.twimg.com",
  "abs.twimg.com",
  "raw.githubusercontent.com",
  "avatars.githubusercontent.com",
  "repository-images.githubusercontent.com",
  "opengraph.githubassets.com",
  "img.bilibili.com",
  "i0.hdslb.com",
  "i1.hdslb.com",
  "i2.hdslb.com",
  "sns-img-bd.xhscdn.com",
  "ci.xiaohongshu.com",
]);

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.has(hostname)) return true;
  // 允许 *.microlink.io
  if (hostname.endsWith(".microlink.io")) return true;
  // 允许 *.githubusercontent.com
  if (hostname.endsWith(".githubusercontent.com")) return true;
  // 允许 *.xhscdn.com
  if (hostname.endsWith(".xhscdn.com")) return true;
  // 允许 *.hdslb.com (B站)
  if (hostname.endsWith(".hdslb.com")) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !url.startsWith("http")) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new NextResponse(`Host not allowed: ${parsed.hostname}`, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AIToolsHub/1.0)",
        Referer: `${parsed.protocol}//${parsed.host}/`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream ${upstream.status}`, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
