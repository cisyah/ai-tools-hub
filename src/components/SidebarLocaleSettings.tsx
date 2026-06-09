"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { useTranslation } from "@/components/LocaleProvider";
import { localeOptions, type Locale } from "@/lib/i18n/locales";

const controlShell = "inline-flex h-9 items-stretch rounded-md border border-border bg-surface p-0.5";
const segmentBase = "flex items-center justify-center rounded text-xs font-semibold transition duration-200";
const segmentInactive = "text-muted-foreground hover:bg-surface-strong hover:text-foreground";
const segmentActive = "bg-primary text-primary-foreground";

type SidebarLocaleSettingsProps = {
  className?: string;
};

export function SidebarLocaleSettings({ className = "" }: SidebarLocaleSettingsProps) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();
  const settingsActive = pathname === "/settings";

  return (
    <div className={`${controlShell} gap-0.5 ${className}`}>
      {localeOptions.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value as Locale)}
            className={`${segmentBase} h-full min-w-[2rem] px-2.5 ${active ? segmentActive : segmentInactive}`}
          >
            {option.value === "zh-CN" ? "中" : "EN"}
          </button>
        );
      })}
      <span className="my-1 w-px shrink-0 self-stretch bg-border" aria-hidden="true" />
      <Link
        href="/settings"
        className={`${segmentBase} h-full w-9 shrink-0 ${settingsActive ? segmentActive : segmentInactive}`}
        aria-label={t("nav.settings")}
        aria-current={settingsActive ? "page" : undefined}
      >
        <Settings size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
