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
      <div className="mb-2 text-xs font-medium text-muted-foreground">{t("locale.label")}</div>
      <div className="inline-flex h-9 items-center rounded-[8px] border border-border bg-surface p-0.5">
        {localeOptions.map((option) => {
          const active = locale === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocale(option.value as Locale)}
              className={`h-8 rounded-[6px] px-3.5 text-sm font-medium transition ${
                active ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-surface-strong hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{t("locale.hint")}</p>
    </div>
  );
}
