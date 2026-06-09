"use client";

import { Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
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
      [card.name, card.url, card.description, card.tags.join(" ")]
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
      <div className="flex h-[88vh] max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
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
            <ul className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2">
              {filteredCards.map((card) => {
                const checked = selectedIds.has(card.id);
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => toggle(card.id)}
                      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                        checked ? "border-accent bg-surface-strong" : "border-border hover:bg-surface-strong"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                          checked ? "border-accent bg-accent text-accent-foreground" : "border-border"
                        }`}
                      >
                        {checked ? <Check size={13} strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{card.name}</span>
                        {card.url ? (
                          <span className="block truncate text-xs text-muted-foreground">{card.url}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
              className="h-10 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
            >
              {saving ? t("pages.listDetail.pickerAdding") : t("pages.listDetail.pickerAdd")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
