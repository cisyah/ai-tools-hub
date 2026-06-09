/**
 * Clean up titles copied from social platforms (Xiaohongshu, etc.)
 * Removes hashtags, extra whitespace, and common noise patterns.
 */

export function cleanTitle(raw: string): string {
  if (!raw) return "";

  let cleaned = raw;

  // 1. Remove #hashtags (Chinese and English, including the tag text)
  cleaned = cleaned.replace(/#[^\s#]+/g, "");

  // 2. Remove common platform noise words
  const noisePatterns = [
    /来自小红书/,
    /来自Xiaohongshu/,
    /- 小红书$/,
    /\| 小红书$/,
    /小红书号[：:]\s*\w+/,
    /复制此链接.*$/,
    /https?:\/\/\S+/g, // URLs
  ];
  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 3. Collapse multiple spaces/newlines into single space
  cleaned = cleaned.replace(/\s+/g, " ");

  // 4. Trim leading/trailing punctuation and whitespace
  cleaned = cleaned.replace(/^[\s\-_·,，。.!！?？]+|[\s\-_·,，。.!！?？]+$/g, "");

  return cleaned.trim();
}
