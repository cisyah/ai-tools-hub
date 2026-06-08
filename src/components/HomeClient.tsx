"use client";

import { useEffect, useMemo, useState } from "react";
import { CardDialog } from "@/components/CardDialog";
import { CardGrid } from "@/components/CardGrid";
import { FilterBar, type FilterState } from "@/components/FilterBar";
import { PageTitle } from "@/components/PageTitle";
import { useToast } from "@/components/ToastProvider";
import type { Card, CardInput, TagCount } from "@/lib/types";

const defaultFilters: FilterState = {
  searchQuery: "",
  filterType: "",
  filterTags: [],
  favorite: "",
};

function matchesSearch(card: Card, query: string) {
  if (!query) return true;
  const haystack = [card.name, card.description, card.url, card.notes, ...card.tags].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function HomeClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCard, setDialogCard] = useState<Card | null | undefined>(undefined);
  const { showToast } = useToast();

  useEffect(() => {
    const saved = window.localStorage.getItem("ai-tools-hub.filters");
    const favoriteParam = new URLSearchParams(window.location.search).get("favorite");
    const queryFilters = favoriteParam === "favorite" ? { favorite: "favorite" as const } : {};

    if (saved) {
      try {
        setFilters({ ...defaultFilters, ...(JSON.parse(saved) as FilterState), ...queryFilters });
      } catch {
        window.localStorage.removeItem("ai-tools-hub.filters");
        setFilters({ ...defaultFilters, ...queryFilters });
      }
    } else if (favoriteParam === "favorite") {
      setFilters({ ...defaultFilters, ...queryFilters });
    }

    Promise.all([
      fetch("/api/cards").then((res) => res.json()),
      fetch("/api/tags").then((res) => res.json()),
    ])
      .then(([cardsPayload, tagsPayload]) => {
        setCards(cardsPayload.cards || []);
        setTags(tagsPayload.tags || []);
      })
      .catch(() => setError("加载工具失败，请确认 MySQL 已初始化并配置 DATABASE_URL。"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ai-tools-hub.filters", JSON.stringify(filters));
  }, [filters]);

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
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "请求失败。");

    const savedCard = payload.card as Card;
    setCards((current) =>
      savedCard.isArchived
        ? current.filter((item) => item.id !== savedCard.id)
        : current.map((item) => (item.id === savedCard.id ? savedCard : item)),
    );
  }

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow="Workspace directory"
        title="Tools"
        description="A focused AI tools directory for filtering by type, tags, and favourites before opening tools in a new tab."
      />
      <FilterBar filters={filters} tags={tags} statusCounts={statusCounts} onChange={setFilters} />
      {loading ? <div className="text-sm text-muted-foreground">加载中...</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {!loading && !error ? (
        <CardGrid
          cards={filteredCards}
          filters={filters}
          onArchive={async (card) => {
            await fetch(`/api/cards/${card.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isArchived: true }),
            });
            setCards((current) => current.filter((item) => item.id !== card.id));
            showToast({
              message: `已归档 ${card.name}`,
              actionLabel: "撤销",
              onAction: async () => {
                await fetch(`/api/cards/${card.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isArchived: false }),
                });
                setCards((current) => [...current, { ...card, isArchived: false }].sort((a, b) => a.sortOrder - b.sortOrder));
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
        />
      ) : null}
      {dialogCard !== undefined ? <CardDialog card={dialogCard} onClose={() => setDialogCard(undefined)} onSubmit={saveCard} /> : null}
    </div>
  );
}
