export type PlatformSource = "youtube" | "bilibili" | "xiaohongshu" | "twitter" | "github" | "other";

const sourceDomains: Record<Exclude<PlatformSource, "other">, string[]> = {
  youtube: ["youtube.com", "m.youtube.com", "youtu.be"],
  bilibili: ["bilibili.com", "www.bilibili.com", "b23.tv"],
  xiaohongshu: ["xiaohongshu.com", "www.xiaohongshu.com", "xhslink.com"],
  twitter: ["twitter.com", "x.com", "t.co"],
  github: ["github.com", "www.github.com", "gist.github.com"],
};

export const platformSourceLabels: Record<PlatformSource, string> = {
  youtube: "YouTube",
  bilibili: "B 站",
  xiaohongshu: "小红书",
  twitter: "X",
  github: "GitHub",
  other: "其他",
};

function normalizeHost(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    return new URL(trimmed).hostname.replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .replace(/^www\./, "")
      .toLowerCase();
  }
}

function hostMatches(host: string, domains: string[]): boolean {
  return domains.some((domain) => host === domain.replace(/^www\./, "") || host.endsWith(`.${domain.replace(/^www\./, "")}`));
}

export function getPlatformSource(url: string, sourceDomain = ""): PlatformSource {
  const hosts = [normalizeHost(url), normalizeHost(sourceDomain)].filter(Boolean);

  for (const host of hosts) {
    if (hostMatches(host, sourceDomains.youtube)) return "youtube";
    if (hostMatches(host, sourceDomains.bilibili)) return "bilibili";
    if (hostMatches(host, sourceDomains.xiaohongshu)) return "xiaohongshu";
    if (hostMatches(host, sourceDomains.twitter)) return "twitter";
    if (hostMatches(host, sourceDomains.github)) return "github";
  }

  return "other";
}

export function getPlatformSourceLabel(url: string, sourceDomain = "", otherLabel = platformSourceLabels.other): string {
  const source = getPlatformSource(url, sourceDomain);
  return source === "other" ? otherLabel : platformSourceLabels[source];
}
