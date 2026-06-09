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
    const timer = setTimeout(() => resolve(false), 5000);
    image.onload = () => { clearTimeout(timer); resolve(true); };
    image.onerror = () => { clearTimeout(timer); resolve(false); };
    image.src = url;
  });
}

export async function pickFirstLoadableImageUrl(urls: string[]): Promise<string | null> {
  const uniqueUrls = [...new Set(urls.filter(isEmbeddablePreviewUrl))];

  for (const url of uniqueUrls) {
    if (await isImageUrlLoadable(url)) return url;
  }

  return null;
}
