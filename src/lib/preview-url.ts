export function isEmbeddablePreviewUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  if (url.startsWith("data:")) return true;
  return /^https?:\/\//i.test(url);
}

export async function isImageUrlLoadable(url: string): Promise<boolean> {
  if (!isEmbeddablePreviewUrl(url)) return false;
  if (url.startsWith("data:")) return true;

  return new Promise((resolve) => {
    const image = new Image();
    const timer = setTimeout(() => resolve(true), 3000); // 超时也算"可用"（可能是慢加载）
    image.onload = () => { clearTimeout(timer); resolve(true); };
    image.onerror = () => { clearTimeout(timer); resolve(false); };
    image.src = url;
  });
}

export async function pickFirstLoadableImageUrl(urls: string[]): Promise<string | null> {
  const uniqueUrls = [...new Set(urls.filter(isEmbeddablePreviewUrl))];

  // 优先返回第一个 http URL，让 CardPreviewVisual 的代理机制兜底
  if (uniqueUrls.length > 0) {
    return uniqueUrls[0];
  }

  return null;
}
