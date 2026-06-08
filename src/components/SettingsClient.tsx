"use client";

import { Check, Palette, RotateCcw } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { PageTitle } from "@/components/PageTitle";
import { useTheme } from "@/components/ThemeProvider";
import { defaultLogoIconId, defaultSiteName, defaultTagline, logoIconOptions, type LogoIconId } from "@/lib/brand";
import { defaultThemeId, themes } from "@/lib/themes";

export function SettingsClient() {
  const { themeId, logoIconId, siteName, tagline, setThemeId, setLogoIconId, setSiteName, setTagline, resetTheme } = useTheme();
  const selectedTheme = themes.find((theme) => theme.id === themeId) || themes[0];
  const selectedIcon = logoIconOptions.find((icon) => icon.id === logoIconId) || logoIconOptions[0];

  return (
    <div className="page-shell space-y-5">
      <PageTitle eyebrow="Preferences" title="Settings" description="These preferences are stored in this browser only and are not written to the database." />

      <section className="space-y-5 rounded-lg border border-border bg-surface p-5 shadow-airbnb">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Palette size={18} aria-hidden="true" />
              Brand Mark
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Combine a Morandi color, display name, and icon for the sidebar logo. The default is Mist Dots.</p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"
            onClick={resetTheme}
            type="button"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <LogoMark size="lg" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{siteName}</div>
                <div className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{tagline}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:min-w-72">
              <div className="rounded-md bg-surface/70 p-3">
                <div className="font-semibold text-foreground">{selectedTheme.name}</div>
                <div className="mt-1">{selectedTheme.color}</div>
              </div>
              <div className="rounded-md bg-surface/70 p-3">
                <div className="font-semibold text-foreground">{selectedIcon.label}</div>
                <div className="mt-1">{selectedIcon.description}</div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold">Display Name</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Site Name</span>
                  <input
                    value={siteName}
                    onChange={(event) => setSiteName(event.target.value)}
                    placeholder={defaultSiteName}
                    maxLength={28}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-ring"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Tagline</span>
                  <input
                    value={tagline}
                    onChange={(event) => setTagline(event.target.value)}
                    placeholder={defaultTagline}
                    maxLength={24}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-ring"
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">Theme Color</div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {themes.map((theme) => {
                  const active = theme.id === themeId;

                  return (
                    <button
                      key={theme.id}
                      className={`group rounded-lg border p-2 text-left transition hover:bg-surface-strong ${
                        active ? "border-primary bg-accent-soft" : "border-border bg-surface"
                      }`}
                      onClick={() => setThemeId(theme.id)}
                      type="button"
                    >
                      <span
                        className="flex h-12 w-full items-center justify-center rounded-md shadow-sm"
                        style={{ backgroundColor: theme.color, color: theme.textColor }}
                      >
                        {active ? <Check size={18} aria-hidden="true" /> : null}
                      </span>
                      <span className="mt-2 block truncate text-xs font-semibold">{theme.name}</span>
                      {theme.id === defaultThemeId ? <span className="mt-1 block text-[11px] font-semibold text-primary">Default</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">Logo Icon</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {logoIconOptions.map((icon) => {
                  const active = icon.id === logoIconId;

                  return (
                    <button
                      key={icon.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-surface-strong ${
                        active ? "border-primary bg-accent-soft" : "border-border bg-surface"
                      }`}
                      onClick={() => setLogoIconId(icon.id as LogoIconId)}
                      type="button"
                    >
                      <LogoMark iconId={icon.id as LogoIconId} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{icon.label}</span>
                        {icon.id === defaultLogoIconId ? <span className="mt-0.5 block text-[11px] font-semibold text-primary">Default</span> : null}
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
