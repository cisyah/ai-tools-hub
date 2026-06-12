// This function is injected into the active tab via chrome.scripting.executeScript.
// It must be fully self-contained (no imports, no outer-scope references).
export function extractPageInfo() {
  const pick = (selectors) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const val = el?.getAttribute("content") || el?.getAttribute("href") || el?.textContent;
      if (val && val.trim()) return val.trim();
    }
    return "";
  };

  const toAbsolute = (url) => {
    if (!url) return "";
    try {
      return new URL(url, document.baseURI).href;
    } catch {
      return "";
    }
  };

  // ── Platform Detection ──────────────────────────────────────────
  function detectPlatform() {
    const host = location.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") return "youtube";
    if (host === "bilibili.com" || host === "m.bilibili.com") return "bilibili";
    if (host === "xiaohongshu.com" || host === "xhslink.com") return "xiaohongshu";
    if (host === "twitter.com" || host === "x.com" || host === "t.co") return "twitter";
    if (host === "github.com" || host === "gist.github.com") return "github";
    return "generic";
  }

  // ── YouTube-specific extraction ─────────────────────────────────
  function extractYouTube() {
    // YouTube has good OG tags, but let's also try to get the channel name
    const channelEl = document.querySelector('link[itemprop="name"]')
      || document.querySelector('span[itemprop="author"] link[itemprop="name"]');
    const channel = channelEl?.getAttribute("content") || channelEl?.textContent || "";

    const title = pick(['meta[property="og:title"]']) || document.title.replace(" - YouTube", "").trim();
    const thumbnail = toAbsolute(pick(['meta[property="og:image"]']));
    const description = pick(['meta[property="og:description"]']) || "";

    return {
      name: title,
      description: channel ? `${channel} · ${description}`.slice(0, 120) : description.slice(0, 120),
      previewUrl: thumbnail,
      platform: "youtube",
      author: channel,
    };
  }

  // ── Bilibili-specific extraction ────────────────────────────────
  function extractBilibili() {
    // B站 OG tags are usually good, but let's also try the page title
    const title = pick(['meta[property="og:title"]'])
      || document.title.replace(/_哔哩哔哩.*$/, "").replace(/_bilibili.*$/, "").trim();
    const thumbnail = toAbsolute(pick(['meta[property="og:image"]']));
    const author = pick(['meta[name="author"]'])
      || document.querySelector(".up-name")?.textContent?.trim()
      || "";
    const description = pick(['meta[property="og:description"]']) || "";

    return {
      name: title,
      description: author ? `${author} · ${description}`.slice(0, 120) : description.slice(0, 120),
      previewUrl: thumbnail,
      platform: "bilibili",
      author,
    };
  }

  // ── Xiaohongshu-specific extraction ─────────────────────────────
  function extractXiaohongshu() {
    // 小红书反爬严重，OG tags 通常为空或不准确
    // 尝试从页面 DOM 提取标题
    const title = document.querySelector("#detail-title")?.textContent?.trim()
      || document.querySelector(".title")?.textContent?.trim()
      || pick(['meta[property="og:title"]'])
      || document.title.replace(/- 小红书$/, "").replace(/- Xiaohongshu$/, "").trim();

    const thumbnail = toAbsolute(
      document.querySelector('meta[property="og:image"]')?.getAttribute("content")
      || document.querySelector(".note-image img")?.src
      || ""
    );

    const author = document.querySelector(".user-nickname")?.textContent?.trim()
      || document.querySelector(".author-wrapper .name")?.textContent?.trim()
      || "";

    return {
      name: cleanXHSTitle(title),
      description: "",
      previewUrl: thumbnail,
      platform: "xiaohongshu",
      author,
    };
  }

  // ── Twitter/X-specific extraction ──────────────────────────────
  function extractTwitter() {
    const title = pick(['meta[property="og:title"]', 'meta[name="twitter:title"]'])
      || document.title.replace(/ on X$/, "").replace( / \| X$/, "").trim();
    const description = pick(['meta[property="og:description"]', 'meta[name="twitter:description"]']) || "";
    const image = toAbsolute(pick(['meta[property="og:image"]', 'meta[name="twitter:image"]']));
    const author = pick(['meta[name="twitter:creator"]'])
      || document.querySelector('[data-testid="User-Name"]')?.textContent?.trim()
      || "";

    return {
      name: title,
      description: author ? `${author} · ${description}`.slice(0, 120) : description.slice(0, 120),
      previewUrl: image,
      platform: "twitter",
      author,
    };
  }

  // ── GitHub-specific extraction ─────────────────────────────────
  function extractGitHub() {
    // GitHub has good OG tags
    const title = pick(['meta[property="og:title"]'])
      || document.title.replace(/ · GitHub$/, "").trim();
    const description = pick(['meta[property="og:description"]']) || "";
    const image = toAbsolute(pick(['meta[property="og:image"]']));
    const author = document.querySelector('.author a, [rel="author"]')?.textContent?.trim()
      || "";

    // Extract repo owner/name from URL
    const pathParts = location.pathname.split("/").filter(Boolean);
    const repoName = pathParts.length >= 2 ? `${pathParts[0]}/${pathParts[1]}` : "";

    return {
      name: repoName || title,
      description: description.slice(0, 120),
      previewUrl: image,
      platform: "github",
      author: author || pathParts[0] || "",
    };
  }

  // ── Title cleanup for social platforms ──────────────────────────
  function cleanXHSTitle(raw) {
    if (!raw) return "";
    let cleaned = raw;
    // Remove #hashtags
    cleaned = cleaned.replace(/#[^\s#]+/g, "");
    // Remove noise
    cleaned = cleaned.replace(/来自小红书|来自Xiaohongshu|- 小红书$|\| 小红书$/g, "");
    cleaned = cleaned.replace(/小红书号[：:]\s*\w+/g, "");
    cleaned = cleaned.replace(/https?:\/\/\S+/g, "");
    // Collapse whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    // Trim punctuation
    cleaned = cleaned.replace(/^[\s\-_·,，。.!！?？]+|[\s\-_·,，。.!！?？]+$/g, "");
    return cleaned;
  }

  // ── Generic extraction ──────────────────────────────────────────
  function extractGeneric() {
    const canonical = pick(['link[rel="canonical"]']);
    const pageUrl = toAbsolute(canonical) || location.href;

    const title =
      pick(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
      document.title || "";

    let description = pick([
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]);
    if (description.length > 120) description = description.slice(0, 120);

    const image = toAbsolute(
      pick([
        'meta[property="og:image:secure_url"]',
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[name="twitter:image:src"]',
      ])
    );

    const icon = toAbsolute(
      pick([
        'link[rel="apple-touch-icon"]',
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
      ])
    ) || toAbsolute("/favicon.ico");

    const siteName = pick(['meta[property="og:site_name"]']);

    let domain = "";
    try {
      domain = new URL(pageUrl).hostname.replace(/^www\./, "");
    } catch {
      domain = "";
    }

    return {
      name: title,
      description,
      url: pageUrl,
      previewUrl: image || "",
      icon: icon || "",
      sourceDomain: siteName || domain,
      domain,
      platform: "generic",
    };
  }

  // ── Main dispatch ───────────────────────────────────────────────
  const platform = detectPlatform();

  let result;
  switch (platform) {
    case "youtube":
      result = extractYouTube();
      break;
    case "bilibili":
      result = extractBilibili();
      break;
    case "xiaohongshu":
      result = extractXiaohongshu();
      break;
    case "twitter":
      result = extractTwitter();
      break;
    case "github":
      result = extractGitHub();
      break;
    default:
      result = extractGeneric();
      break;
  }

  // Fill in common fields for platform-specific extractors
  if (platform !== "generic") {
    const canonical = pick(['link[rel="canonical"]']);
    const pageUrl = toAbsolute(canonical) || location.href;
    const icon = toAbsolute(
      pick([
        'link[rel="apple-touch-icon"]',
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
      ])
    ) || toAbsolute("/favicon.ico");
    const siteName = pick(['meta[property="og:site_name"]']);
    let domain = "";
    try {
      domain = new URL(pageUrl).hostname.replace(/^www\./, "");
    } catch {
      domain = "";
    }

    result.url = pageUrl;
    result.icon = icon || "";
    result.sourceDomain = siteName || domain;
    result.domain = domain;
  }

  return result;
}
