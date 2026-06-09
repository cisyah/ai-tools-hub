/**
 * Extract the first URL from pasted text.
 * Handles common share formats like:
 *   "让Vibe Coding更好看的小技巧！ http://xhslink.com/o/xxx 直达【小红书】探索笔记全文~"
 *   "【标题】https://b23.tv/xxx"
 */
export function extractUrl(text: string): string | null {
  if (!text) return null;

  // 如果整段就是个 URL，直接返回
  const trimmed = text.trim();
  if (/^https?:\/\/\S+$/.test(trimmed)) return trimmed;

  // 从文本中提取第一个 URL
  const match = trimmed.match(/https?:\/\/[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/);
  if (match) {
    // 去掉末尾可能粘连的中文标点
    return match[0].replace(/[，。！？、；：）】》"'\u3002\uff0c\uff01\uff1f\uff1b\uff1a\uff09\u3011\u300b]+$/, "");
  }

  return null;
}
