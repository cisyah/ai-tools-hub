"use client";

import { Check, Palette, RotateCcw } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoMark } from "@/components/LogoMark";
import { PageTitle } from "@/components/PageTitle";
import { useTranslation } from "@/components/LocaleProvider";
import { useTheme } from "@/components/ThemeProvider";
import { translateEnglish } from "@/lib/i18n";
import { defaultLogoIconId, defaultSiteName, defaultTagline, logoIconOptions, type LogoIconId } from "@/lib/brand";
import { defaultThemeId, themes } from "@/lib/themes";

export function SettingsClient() {
  const { t } = useTranslation();
  const { themeId, logoIconId, siteName, tagline, setThemeId, setLogoIconId, setSiteName, setTagline, resetTheme } = useTheme();
  const selectedTheme = themes.find((theme) => theme.id === themeId) || themes[0];
  const selectedIcon = logoIconOptions.find((icon) => icon.id === logoIconId) || logoIconOptions[0];

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow={translateEnglish("pages.settings.eyebrow")}
        title={t("nav.settings")}
        description={t("pages.settings.description")}
      />

      <section className="rounded-[10px] border border-border bg-surface p-5 shadow-airbnb">
        <LanguageSwitcher />
      </section>

      <section className="space-y-5 rounded-[10px] border border-border bg-surface p-5 shadow-airbnb">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Palette size={16} aria-hidden="true" />
              {t("pages.settings.brandMark")}
            </div>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{t("pages.settings.brandDesc")}</p>
          </div>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-muted-foreground transition hover:bg-surface-strong hover:text-foreground"
            onClick={resetTheme}
            type="button"
          >
            <RotateCcw size={16} aria-hidden="true" />
            {t("common.reset")}
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-accent-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <LogoMark size="md" />
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{siteName}</div>
                <div className="max-w-[180px] truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{tagline}</div>
              </div>
            </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground sm:justify-end">
                <div className="inline-flex min-h-10 max-w-[240px] items-center gap-2.5 rounded-full border border-border bg-surface/80 px-4 py-2">
                  <span className="truncate font-medium text-foreground">{selectedTheme.name}</span>
                  <div className="grid h-2.5 w-14 shrink-0 grid-cols-4 overflow-hidden rounded-full border border-border">
                    {selectedTheme.swatches.map((swatch) => (
                      <span key={swatch} style={{ backgroundColor: swatch }} />
                  ))}
                </div>
                </div>
                <div className="inline-flex min-h-10 max-w-[210px] items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2">
                  <span className="truncate font-medium text-foreground">{selectedIcon.label}</span>
                </div>
              </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold">{t("pages.settings.displayName")}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{t("pages.settings.siteName")}</span>
                  <input
                    value={siteName}
                    onChange={(event) => setSiteName(event.target.value)}
                    placeholder={defaultSiteName}
                    maxLength={28}
                    className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-ring"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{t("pages.settings.tagline")}</span>
                  <input
                    value={tagline}
                    onChange={(event) => setTagline(event.target.value)}
                    placeholder={defaultTagline}
                    maxLength={24}
                    className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-ring"
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">{t("pages.settings.themeColor")}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme) => {
                  const active = theme.id === themeId;

                  return (
                    <button
                      key={theme.id}
                      aria-pressed={active}
                      className={`group relative h-[70px] rounded-[10px] border p-2.5 text-left transition hover:bg-surface-strong ${
                        active ? "border-border bg-accent-soft shadow-[0_0_0_3px_var(--accent-soft)]" : "border-border bg-surface"
                      }`}
                      onClick={() => setThemeId(theme.id)}
                      type="button"
                    >
                      <span className="grid h-5 grid-cols-4 overflow-hidden rounded-md border border-border">
                        {theme.swatches.map((swatch) => (
                          <span key={swatch} style={{ backgroundColor: swatch }} />
                        ))}
                      </span>
                      <span className="mt-2.5 flex min-w-0 items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {theme.name}
                            {theme.id === defaultThemeId ? (
                              <span className="ml-1 font-normal text-muted-foreground">({t("common.default")})</span>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-surface text-transparent"
                          }`}
                          aria-hidden="true"
                        >
                          <Check size={12} />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">{t("pages.settings.logoIcon")}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {logoIconOptions.map((icon) => {
                  const active = icon.id === logoIconId;

                  return (
                    <button
                      key={icon.id}
                      className={`flex h-[52px] items-center gap-2.5 rounded-[10px] border px-3 text-left transition hover:bg-surface-strong ${
                        active ? "border-border bg-accent-soft" : "border-border bg-surface"
                      }`}
                      onClick={() => setLogoIconId(icon.id as LogoIconId)}
                      type="button"
                    >
                      <LogoMark iconId={icon.id as LogoIconId} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {icon.label}
                          {icon.id === defaultLogoIconId ? (
                            <span className="ml-1 font-normal text-muted-foreground">({t("common.default")})</span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
