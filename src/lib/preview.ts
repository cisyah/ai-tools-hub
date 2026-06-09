import { CARD_DESCRIPTION_MAX_LENGTH, isExternalHttpUrl } from "@/lib/validation";
import type { MetadataResult } from "@/lib/types";

function truncateDescription(value: string): string {
  return value.slice(0, CARD_DESCRIPTION_MAX_LENGTH);
}

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

export async function fetchUrlMetadata(url: string): Promise<MetadataResult> {
  const fallback: MetadataResult = {
    title: "",
    description: "",
    previewUrl: null,
    previewUrlCandidates: [],
    sourceDomain: getDomain(url),
  };

  if (!isExternalHttpUrl(url)) return fallback;

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
      description: truncateDescription(payload.data?.description || ""),
      previewUrl: previewUrlCandidates[0] ?? null,
      previewUrlCandidates,
      sourceDomain: getDomain(payload.data?.url || url),
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
}): Promise<Pick<MetadataResult, "title" | "description" | "previewUrl" | "sourceDomain">> {
  if (input.name && input.description && input.previewUrl && input.sourceDomain) {
    return {
      title: input.name,
      description: truncateDescription(input.description),
      previewUrl: input.previewUrl,
      sourceDomain: input.sourceDomain,
    };
  }

  const metadata = await fetchUrlMetadata(input.url);

  return {
    title: input.name || metadata.title,
    description: truncateDescription(input.description || metadata.description),
    previewUrl: input.previewUrl || metadata.previewUrl,
    sourceDomain: input.sourceDomain || metadata.sourceDomain,
  };
}
