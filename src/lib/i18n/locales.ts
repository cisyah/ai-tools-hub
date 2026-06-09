export type Locale = "zh-CN" | "en";

export const defaultLocale: Locale = "zh-CN";
export const localeStorageKey = "ai-tools-hub.locale";

export const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" },
];

export function isLocale(value: string | null): value is Locale {
  return value === "zh-CN" || value === "en";
}

export function resolveLocale(value: string | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}
