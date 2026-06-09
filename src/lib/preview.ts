import { isExternalHttpUrl } from "@/lib/validation";
import { extractPlatformMetadata } from "@/lib/platform-extractors";
import type { MetadataResult } from "@/lib/types";

type MicrolinkMedia = {
  url?: string;
};

type MicrolinkResponse = {
  status?: string;
  data?: {
    title?: string;
    description?: string;
    publisher?: string;
    url?: string;
    screenshot?: MicrolinkMedia;
    image?: MicrolinkMedia;
    video?: MicrolinkMedia;
  };
};

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function resolvePreviewUrlCandidates(data: MicrolinkResponse["data"]): string[] {
  if (!data) return [];

  const candidates: string[] = [];

  if (data.video?.url && data.image?.url) {
    candidates.push(data.image.url);
  } else if (data.image?.url) {
    candidates.push(data.image.url);
  }

  if (data.screenshot?.url) {
    candidates.push(data.screenshot.url);
  }

  return [...new Set(candidates)];
}

export function resolvePreviewUrl(data: MicrolinkResponse["data"]): string | null {
  return resolvePreviewUrlCandidates(data)[0] ?? null;
}

const emptyFallback: MetadataResult = {
  title: "",
  description: "",
  previewUrl: null,
  previewUrlCandidates: [],
  sourceDomain: "",
  author: "",
  platform: "generic",
};

export async function fetchUrlMetadata(url: string): Promise<MetadataResult> {
  const domain = getDomain(url);
  const fallback: MetadataResult = { ...emptyFallback, sourceDomain: domain };

  if (!isExternalHttpUrl(url)) return fallback;

  // ── 1. 尝试平台专属提取器 ──────────────────────────────────
  try {
    const platformResult = await extractPlatformMetadata(url);
    if (platformResult) {
      // 小红书：返回平台标记但无标题，提示用户手动填写
      if (
        platformResult.platform === "xiaohongshu" &&
        !platformResult.title
      ) {
        return {
          title: "",
          description: "",
          previewUrl: null,
          previewUrlCandidates: [],
          sourceDomain: domain,
          author: "",
          platform: "xiaohongshu",
        };
      }
      // 其他平台：有标题就用
      if (platformResult.title) {
        return {
          title: platformResult.title,
          description: "",
          previewUrl: platformResult.thumbnail,
          previewUrlCandidates: platformResult.thumbnail
            ? [platformResult.thumbnail]
            : [],
          sourceDomain: domain,
          author: platformResult.author,
          platform: platformResult.platform,
        };
      }
    }
  } catch {
    // 平台提取器失败，继续走 Microlink
  }

  // ── 2. 兜底：Microlink 通用抓取 ────────────────────────────
  try {
    const endpoint = new URL("https://api.microlink.io/");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("screenshot", "true");
    endpoint.searchParams.set("video", "true");

    const apiKey = process.env.MICROLINK_API_KEY;
    const response = await fetch(endpoint, {
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return fallback;

    const payload = (await response.json()) as MicrolinkResponse;
    const previewUrlCandidates = resolvePreviewUrlCandidates(payload.data);

    return {
      title: payload.data?.title || "",
      description: payload.data?.description || "",
      previewUrl: previewUrlCandidates[0] ?? null,
      previewUrlCandidates,
      sourceDomain: getDomain(payload.data?.url || url),
      author: payload.data?.publisher || "",
      platform: "generic",
    };
  } catch {
    return fallback;
  }
}

export async function resolveCardMetadata(input: {
  name: string;
  description: string;
  url: string;
  previewUrl?: string | null;
  sourceDomain?: string;
}): Promise<Pick<MetadataResult, "title" | "description" | "previewUrl" | "sourceDomain" | "author" | "platform">> {
  if (input.name && input.description && input.previewUrl && input.sourceDomain) {
    return {
      title: input.name,
      description: input.description,
      previewUrl: input.previewUrl,
      sourceDomain: input.sourceDomain,
      author: "",
      platform: "generic",
    };
  }

  const metadata = await fetchUrlMetadata(input.url);

  return {
    title: input.name || metadata.title,
    description: input.description || metadata.description,
    previewUrl: input.previewUrl || metadata.previewUrl,
    sourceDomain: input.sourceDomain || metadata.sourceDomain,
    author: metadata.author,
    platform: metadata.platform,
  };
}
