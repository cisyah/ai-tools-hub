export const defaultCardTypeSeed = [
  { id: "my_app", label: "我的应用", sortOrder: 0 },
  { id: "external_link", label: "外部链接", sortOrder: 10 },
  { id: "doc", label: "文档", sortOrder: 20 },
  { id: "tutorial", label: "教程", sortOrder: 30 },
  { id: "inspiration", label: "灵感", sortOrder: 40 },
  { id: "case_study", label: "案例", sortOrder: 50 },
] as const;

export const CARD_TYPE_SLUG_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

export function isCardTypeSlug(value: string): boolean {
  return CARD_TYPE_SLUG_PATTERN.test(value);
}

export function slugifyCardTypeLabel(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  if (normalized && CARD_TYPE_SLUG_PATTERN.test(normalized)) {
    return normalized;
  }

  return `type_${Date.now().toString(36)}`;
}
