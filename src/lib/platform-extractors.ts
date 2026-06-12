/**
 * Platform-specific metadata extractors for video/social platforms.
 * Detects platform from URL and fetches rich metadata (title, author, thumbnail).
 */

export type PlatformMetadata = {
  title: string;
  author: string;
  thumbnail: string | null;
  platform: "youtube" | "bilibili" | "xiaohongshu" | "twitter" | "github" | "generic";
};

// ── Platform Detection ──────────────────────────────────────────────

type PlatformInfo = {
  platform: PlatformMetadata["platform"];
  id: string | null;
};

export function detectPlatform(url: string): PlatformInfo {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube: youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/shorts/xxx
    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = u.searchParams.get("v");
      if (videoId) return { platform: "youtube", id: videoId };
      const shortsMatch = u.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shortsMatch) return { platform: "youtube", id: shortsMatch[1] };
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("?")[0];
      if (id) return { platform: "youtube", id };
    }

    // B站: bilibili.com/video/BVxxx, b23.tv/xxx
    if (host === "bilibili.com" || host === "m.bilibili.com") {
      const bvMatch = u.pathname.match(/\/video\/(BV[\w]+)/);
      if (bvMatch) return { platform: "bilibili", id: bvMatch[1] };
    }

    // 小红书: xiaohongshu.com/explore/xxx, xhslink.com/xxx
    if (host === "xiaohongshu.com" || host === "xhslink.com") {
      const idMatch = u.pathname.match(/\/explore\/([\w]+)/);
      if (idMatch) return { platform: "xiaohongshu", id: idMatch[1] };
      const noteMatch = u.pathname.match(/\/discovery\/item\/([\w]+)/);
      if (noteMatch) return { platform: "xiaohongshu", id: noteMatch[1] };
    }

    // Twitter/X: twitter.com/user/status/xxx, x.com/user/status/xxx
    if (host === "twitter.com" || host === "x.com") {
      const statusMatch = u.pathname.match(/\/status\/(\d+)/);
      if (statusMatch) return { platform: "twitter", id: statusMatch[1] };
      return { platform: "twitter", id: null };
    }

    // GitHub: github.com/owner/repo
    if (host === "github.com" || host === "gist.github.com") {
      return { platform: "github", id: null };
    }

    return { platform: "generic", id: null };
  } catch {
    return { platform: "generic", id: null };
  }
}

// ── YouTube (oEmbed API, no key needed) ─────────────────────────────

async function extractYouTube(
  url: string
): Promise<PlatformMetadata | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const thumbnailUrl =
      data.thumbnail_url || (data.thumbnail_url_hq || null);

    return {
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: thumbnailUrl,
      platform: "youtube",
    };
  } catch {
    return null;
  }
}

// ── B站 (公共 API) ──────────────────────────────────────────────────

type BilibiliApiResponse = {
  code: number;
  data?: {
    title?: string;
    owner?: { name?: string };
    pic?: string; // 封面图 URL
  };
};

async function extractBilibili(
  url: string,
  id: string | null
): Promise<PlatformMetadata | null> {
  try {
    // 需要先解析 b23.tv 短链
    let targetUrl = url;
    if (url.includes("b23.tv")) {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      targetUrl = res.url;
    }

    // 从 URL 提取 BV 号
    const bvMatch = targetUrl.match(/(BV[\w]+)/);
    const bvid = id || bvMatch?.[1];
    if (!bvid) return null;

    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://www.bilibili.com",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as BilibiliApiResponse;
    if (json.code !== 0 || !json.data) return null;

    return {
      title: json.data.title || "",
      author: json.data.owner?.name || "",
      thumbnail: json.data.pic?.startsWith("//")
        ? `https:${json.data.pic}`
        : json.data.pic || null,
      platform: "bilibili",
    };
  } catch {
    return null;
  }
}

// ── 小红书 (反爬严格，返回平台标记，提示用户手动填写) ────────────────

async function extractXiaohongshu(
  _url: string
): Promise<PlatformMetadata | null> {
  // 小红书反爬很严，无法自动获取元数据
  // 返回平台标记，让前端知道这是小红书链接，引导用户手动填写
  return {
    title: "",
    author: "",
    thumbnail: null,
    platform: "xiaohongshu",
  };
}

// ── Twitter/X (使用 OG tags) ────────────────────────────────────────

async function extractTwitter(
  _url: string
): Promise<PlatformMetadata | null> {
  // Twitter 也需要通过浏览器提取，服务端无法直接获取
  // 返回平台标记，让 Chrome 插件在客户端提取
  return {
    title: "",
    author: "",
    thumbnail: null,
    platform: "twitter",
  };
}

// ── GitHub (使用 OG tags) ───────────────────────────────────────────

async function extractGitHub(
  url: string
): Promise<PlatformMetadata | null> {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const [owner, repo] = parts;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AI-Tools-Hub",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const data = await res.json();

    return {
      title: data.full_name || `${owner}/${repo}`,
      author: data.owner?.login || owner,
      thumbnail: data.owner?.avatar_url || null,
      platform: "github",
    };
  } catch {
    return null;
  }
}

// ── 统一入口 ────────────────────────────────────────────────────────

export async function extractPlatformMetadata(
  url: string
): Promise<PlatformMetadata | null> {
  const { platform, id } = detectPlatform(url);

  switch (platform) {
    case "youtube":
      return extractYouTube(url);
    case "bilibili":
      return extractBilibili(url, id);
    case "xiaohongshu":
      return extractXiaohongshu(url);
    case "twitter":
      return extractTwitter(url);
    case "github":
      return extractGitHub(url);
    default:
      return null;
  }
}
