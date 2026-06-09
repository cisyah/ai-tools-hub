"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { localeOptions, type Locale } from "@/lib/i18n/locales";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();

  if (compact) {
    return (
      <div className={`inline-flex h-9 items-center rounded-md border border-border bg-surface p-0.5 ${className}`}>
        {localeOptions.map((option) => {
          const active = locale === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value as Locale)}
              className={`flex h-full items-center rounded px-2.5 text-xs font-semibold transition ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.value === "zh-CN" ? "中" : "EN"}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 text-sm font-semibold">{t("locale.label")}</div>
      <div className="grid grid-cols-2 gap-2">
        {localeOptions.map((option) => {
          const active = locale === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value as Locale)}
              className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                active ? "border-accent bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-surface-strong"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("locale.hint")}</p>
    </div>
  );
}
