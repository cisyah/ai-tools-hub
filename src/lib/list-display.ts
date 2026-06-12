export const listEmojiOptions = [
  "📌",
  "⭐",
  "🔥",
  "✨",
  "💡",
  "🎯",
  "✅",
  "🚀",
  "🧠",
  "🧰",
  "🧪",
  "📚",
  "📖",
  "📝",
  "📄",
  "📊",
  "📈",
  "📉",
  "🗂️",
  "📁",
  "🗃️",
  "🔖",
  "🏷️",
  "🔍",
  "🔗",
  "🧩",
  "⚙️",
  "🛠️",
  "💻",
  "⌨️",
  "🖥️",
  "📱",
  "🤖",
  "🎨",
  "🖼️",
  "🎬",
  "🎧",
  "🎙️",
  "📷",
  "✍️",
  "💬",
  "📮",
  "📣",
  "🧭",
  "🗺️",
  "⏰",
  "📅",
  "🧾",
  "💰",
  "🛒",
  "🏦",
  "🧱",
  "🏗️",
  "🧬",
  "🔬",
  "🌐",
  "☁️",
  "🔒",
  "🔑",
  "🛡️",
  "❤️",
  "💜",
  "💙",
  "💚",
  "💛",
  "🖤",
  "☕",
  "🍵",
  "🌱",
  "🌿",
  "🌙",
  "☀️",
  "⚡",
  "💎",
  "🏆",
  "🎁",
] as const;

export function splitListDisplayName(name: string): { emoji: string; title: string } {
  const trimmed = name.trim();
  const emoji = listEmojiOptions.find((option) => trimmed === option || trimmed.startsWith(`${option} `));

  if (!emoji) {
    const customEmoji = trimmed.match(/^((?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\uFE0F)?(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\uFE0F)?)*)\s+/u);

    if (!customEmoji) return { emoji: "", title: trimmed };

    return {
      emoji: customEmoji[1],
      title: trimmed.slice(customEmoji[0].length).trimStart(),
    };
  }

  return {
    emoji,
    title: trimmed.slice(emoji.length).trimStart(),
  };
}

export function composeListDisplayName(emoji: string, title: string): string {
  return emoji ? `${emoji} ${title}` : title;
}
