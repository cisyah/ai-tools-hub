"use client";

import { Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CardPreviewVisual } from "@/components/CardPreviewVisual";
import { useTranslation } from "@/components/LocaleProvider";
import { getPlatformSourceLabel } from "@/lib/platform-source";
import type { Card } from "@/lib/types";

type ListCardPickerProps = {
  listName: string;
  cards: Card[];
  onClose: () => void;
  onConfirm: (cardIds: string[]) => Promise<void>;
};

export function ListCardPicker({ listName, cards, onClose, onConfirm }: ListCardPickerProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) =>
      [card.name, card.url, card.description, card.sourceDomain, card.tags.join(" ")]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [cards, searchQuery]);

  function toggle(cardId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!selectedIds.size) return;
    setSaving(true);
    setError("");
    try {
      await onConfirm(Array.from(selectedIds));
      onClose();
    } catch {
      setError(t("pages.listDetail.pickerAddError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t("pages.listDetail.pickerTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("pages.listDetail.pickerDescription", { name: listName })}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-surface-strong"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("pages.listDetail.pickerSearchPlaceholder")}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm outline-none transition focus:border-ring"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {!cards.length ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t("pages.listDetail.pickerEmpty")}</div>
          ) : !filteredCards.length ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t("pages.listDetail.pickerNoMatch")}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCards.map((card) => {
                const checked = selectedIds.has(card.id);
                const sourceLabel = getPlatformSourceLabel(card.url, card.sourceDomain, t("platformSources.other"));
                return (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => toggle(card.id)}
                    className={`group overflow-hidden rounded-lg border-[0.5px] bg-app-card-surface text-left text-app-card-foreground transition duration-200 hover:-translate-y-0.5 ${
                      checked ? "border-primary ring-2 ring-primary/20" : "border-app-card-border hover:border-app-card-foreground/25"
                    }`}
                  >
                    <div className="relative">
                      <CardPreviewVisual
                        previewUrl={card.previewUrl}
                        previewPosition={card.previewPosition}
                        icon={card.icon}
                        imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                      />
                      <span
                        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface/90 text-transparent"
                        }`}
                      >
                        <Check size={16} strokeWidth={3} />
                      </span>
                    </div>
                    <div className="px-4 pb-4 pt-4">
                      <div className="truncate text-base font-bold leading-tight tracking-normal text-[#454545]">{card.name}</div>
                      <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-app-card-muted">{card.description}</p>
                    </div>
                    <div className="flex items-center gap-2 border-t border-[#EEECE5] bg-app-card-surface px-3 py-2 text-xs text-app-card-muted">
                      <span className="inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-accent-soft px-2.5 text-[11px] font-normal leading-none text-foreground">
                        {sourceLabel}
                      </span>
                      <span className="truncate font-normal text-app-card-muted">{card.sourceDomain || card.url}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error ? <div className="px-6 pt-2 text-sm text-red-600">{error}</div> : null}

        <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {t("pages.listDetail.pickerSelected", { count: selectedIds.size })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-strong"
              onClick={onClose}
            >
              {t("common.close")}
            </button>
            <button
              type="button"
              disabled={!selectedIds.size || saving}
              onClick={handleConfirm}
              className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground disabled:opacity-60"
            >
              {saving ? t("pages.listDetail.pickerAdding") : t("pages.listDetail.pickerAdd")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
