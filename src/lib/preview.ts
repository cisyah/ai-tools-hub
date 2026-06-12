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

/**
 * 图片优先级：
 * 1. og:image（封面图）
 * 2. 文章/视频中的图片
 * 3. 页面截图
 * 最低保障：一定有截图
 */
export function resolvePreviewUrlCandidates(data: MicrolinkResponse["data"]): string[] {
  if (!data) return [];

  const candidates: string[] = [];

  // 有视频时，优先用封面图（不直接用视频 URL）
  if (data.video?.url && data.image?.url) {
    candidates.push(data.image.url);
  } else if (data.image?.url) {
    candidates.push(data.image.url);
  }

  // 截图兜底
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

  // ── 1. 平台专属提取器：只取 title / author / platform ──
  let platformTitle = "";
  let platformAuthor = "";
  let platformId: MetadataResult["platform"] = "generic";

  try {
    const platformResult = await extractPlatformMetadata(url);
    if (platformResult) {
      // 小红书完全无法提取，直接返回
      if (platformResult.platform === "xiaohongshu" && !platformResult.title) {
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
      platformTitle = platformResult.title || "";
      platformAuthor = platformResult.author || "";
      platformId = platformResult.platform;
    }
  } catch {
    // 平台提取器失败，继续走 Microlink
  }

  // ── 2. Microlink：负责图片（og:image → 截图）+ 补充元数据 ──
  try {
    const endpoint = new URL("https://api.microlink.io/");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("screenshot", "true");
    endpoint.searchParams.set("video", "true");

    const apiKey = process.env.MICROLINK_API_KEY;
    const response = await fetch(endpoint, {
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      // Microlink 失败，用平台数据（无图片）
      if (platformTitle) {
        return {
          title: platformTitle,
          description: "",
          previewUrl: null,
          previewUrlCandidates: [],
          sourceDomain: domain,
          author: platformAuthor,
          platform: platformId,
        };
      }
      return fallback;
    }

    const payload = (await response.json()) as MicrolinkResponse;
    const previewUrlCandidates = resolvePreviewUrlCandidates(payload.data);

    return {
      title: platformTitle || payload.data?.title || "",
      description: payload.data?.description || "",
      previewUrl: previewUrlCandidates[0] ?? null,
      previewUrlCandidates,
      sourceDomain: getDomain(payload.data?.url || url),
      author: platformAuthor || payload.data?.publisher || "",
      platform: platformId,
    };
  } catch {
    // Microlink 异常，用平台数据（无图片）
    if (platformTitle) {
      return {
        title: platformTitle,
        description: "",
        previewUrl: null,
        previewUrlCandidates: [],
        sourceDomain: domain,
        author: platformAuthor,
        platform: platformId,
      };
    }
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
