import { isExternalHttpUrl } from "@/lib/validation";
import type { MetadataResult } from "@/lib/types";

type MicrolinkResponse = {
  status?: string;
  data?: {
    title?: string;
    description?: string;
    publisher?: string;
    url?: string;
    screenshot?: {
      url?: string;
    };
    image?: {
      url?: string;
    };
  };
};

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function fetchUrlMetadata(url: string): Promise<MetadataResult> {
  const fallback: MetadataResult = {
    title: "",
    description: "",
    previewUrl: null,
    sourceDomain: getDomain(url),
  };

  if (!isExternalHttpUrl(url)) return fallback;

  try {
    const endpoint = new URL("https://api.microlink.io/");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("screenshot", "true");

    const apiKey = process.env.MICROLINK_API_KEY;
    const response = await fetch(endpoint, {
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return fallback;

    const payload = (await response.json()) as MicrolinkResponse;
    return {
      title: payload.data?.title || "",
      description: payload.data?.description || "",
      previewUrl: payload.data?.screenshot?.url || payload.data?.image?.url || null,
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
      description: input.description,
      previewUrl: input.previewUrl,
      sourceDomain: input.sourceDomain,
    };
  }

  const metadata = await fetchUrlMetadata(input.url);

  return {
    title: input.name || metadata.title,
    description: input.description || metadata.description,
    previewUrl: input.previewUrl || metadata.previewUrl,
    sourceDomain: input.sourceDomain || metadata.sourceDomain,
  };
}
