"use client";

import { useEffect, useMemo, useState } from "react";
import { CardDialog } from "@/components/CardDialog";
import { CardGrid } from "@/components/CardGrid";
import { FilterBar, type FilterState } from "@/components/FilterBar";
import { PageTitle } from "@/components/PageTitle";
import { useTranslation } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastProvider";
import { parseApiError, translateEnglish } from "@/lib/i18n";
import type { Card, CardInput, TagCount } from "@/lib/types";

const defaultFilters: FilterState = {
  searchQuery: "",
  filterType: "",
  filterTags: [],
  favorite: "",
};

function matchesSearch(card: Card, query: string) {
  if (!query) return true;
  const haystack = [card.name, card.description, card.url, card.notes, card.sourceDomain, ...card.tags].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function ArchiveClient() {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCard, setDialogCard] = useState<Card | null | undefined>(undefined);
  const { showToast } = useToast();

  async function refreshCards() {
    const [cardsResponse, tagsResponse] = await Promise.all([
      fetch("/api/cards?includeArchived=1"),
      fetch("/api/tags?includeArchived=1"),
    ]);

    if (!cardsResponse.ok) throw new Error(await parseApiError(cardsResponse, t));
    if (!tagsResponse.ok) throw new Error(await parseApiError(tagsResponse, t));

    const cardsPayload = await cardsResponse.json();
    const tagsPayload = await tagsResponse.json();
    setCards((cardsPayload.cards || []).filter((card: Card) => card.isArchived));
    setTags(tagsPayload.tags || []);
  }

  useEffect(() => {
    refreshCards()
      .catch(() => setError(t("pages.archive.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        if (filters.filterType && card.type !== filters.filterType) return false;
        if (filters.favorite === "favorite" && !card.isFavorite) return false;
        if (filters.favorite === "normal" && card.isFavorite) return false;
        if (!matchesSearch(card, filters.searchQuery.trim())) return false;
        return filters.filterTags.every((tag) => card.tags.includes(tag));
      }),
    [cards, filters],
  );

  const statusCounts = useMemo(() => {
    const baseCards = cards.filter((card) => {
      if (filters.filterType && card.type !== filters.filterType) return false;
      if (!matchesSearch(card, filters.searchQuery.trim())) return false;
      return filters.filterTags.every((tag) => card.tags.includes(tag));
    });

    return {
      all: baseCards.length,
      favorite: baseCards.filter((card) => card.isFavorite).length,
      normal: baseCards.filter((card) => !card.isFavorite).length,
    };
  }, [cards, filters.filterTags, filters.filterType, filters.searchQuery]);

  async function saveCard(input: CardInput) {
    if (!dialogCard) return;

    const response = await fetch(`/api/cards/${dialogCard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await parseApiError(response, t));
    await refreshCards();
  }

  async function deleteCard(card: Card) {
    const response = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await parseApiError(response, t));
    setCards((current) => current.filter((item) => item.id !== card.id));
    showToast({ message: t("toast.deleted", { name: card.name }) });
  }

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow={translateEnglish("pages.archive.eyebrow")}
        title={t("nav.archive")}
        description={t("pages.archive.description")}
      />
      <FilterBar filters={filters} tags={tags} statusCounts={statusCounts} onChange={setFilters} />
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {!loading && !error ? (
        <CardGrid
          cards={filteredCards}
          filters={filters}
          showRestore
          onRestore={async (card) => {
            await fetch(`/api/cards/${card.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isArchived: false }),
            });
            setCards((current) => current.filter((item) => item.id !== card.id));
            showToast({
              message: t("toast.restored", { name: card.name }),
              actionLabel: t("toast.undo"),
              onAction: async () => {
                await fetch(`/api/cards/${card.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isArchived: true }),
                });
                await refreshCards();
              },
            });
          }}
          onFavorite={async (card) => {
            const nextFavorite = !card.isFavorite;
            await fetch(`/api/cards/${card.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isFavorite: nextFavorite }),
            });
            setCards((current) => current.map((item) => (item.id === card.id ? { ...item, isFavorite: nextFavorite } : item)));
          }}
          onEdit={(card) => setDialogCard(card)}
          onDelete={async (card) => {
            const confirmed = window.confirm(t("cardDialog.deleteConfirm", { name: card.name }));
            if (!confirmed) return;
            await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
            setCards((current) => current.filter((item) => item.id !== card.id));
          }}
        />
      ) : null}
      {dialogCard !== undefined ? (
        <CardDialog
          card={dialogCard}
          onClose={() => setDialogCard(undefined)}
          onSubmit={saveCard}
          onDelete={dialogCard ? deleteCard : undefined}
        />
      ) : null}
    </div>
  );
}
