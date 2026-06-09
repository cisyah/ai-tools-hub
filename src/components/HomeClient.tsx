"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const haystack = [card.name, card.description, card.url, card.notes, ...card.tags].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function HomeClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCard, setDialogCard] = useState<Card | null | undefined>(undefined);
  const { showToast } = useToast();
  const storedFiltersLoaded = useRef(false);

  const tagParam = searchParams.get("tag")?.trim() || "";
  const isFavouritesView = searchParams.get("favorite") === "favorite";

  useEffect(() => {
    Promise.all([
      fetch("/api/cards").then((res) => res.json()),
      fetch("/api/tags").then((res) => res.json()),
    ])
      .then(([cardsPayload, tagsPayload]) => {
        setCards(cardsPayload.cards || []);
        setTags(tagsPayload.tags || []);
      })
      .catch(() => setError(t("pages.home.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    const favoriteParam = searchParams.get("favorite");
    const nextTag = searchParams.get("tag")?.trim() || "";
    const urlFilters: Pick<FilterState, "favorite" | "filterTags"> = {
      favorite: favoriteParam === "favorite" ? "favorite" : favoriteParam === "normal" ? "normal" : "",
      filterTags: nextTag ? [nextTag] : [],
    };

    if (!storedFiltersLoaded.current) {
      storedFiltersLoaded.current = true;
      let base = defaultFilters;
      const saved = window.localStorage.getItem("ai-tools-hub.filters");
      if (saved) {
        try {
          base = { ...defaultFilters, ...(JSON.parse(saved) as FilterState) };
        } catch {
          window.localStorage.removeItem("ai-tools-hub.filters");
        }
      }
      setFilters({ ...base, ...urlFilters });
      return;
    }

    setFilters((prev) => ({ ...prev, ...urlFilters }));
  }, [searchParams]);

  useEffect(() => {
    window.localStorage.setItem("ai-tools-hub.filters", JSON.stringify(filters));
  }, [filters]);

  function updateFilters(next: FilterState) {
    setFilters(next);

    const params = new URLSearchParams();
    if (next.favorite === "favorite") params.set("favorite", "favorite");
    else if (next.favorite === "normal") params.set("favorite", "normal");
    if (next.filterTags.length === 1) params.set("tag", next.filterTags[0]);

    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

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
    const editing = dialogCard && "id" in dialogCard;
    const response = await fetch(editing ? `/api/cards/${dialogCard.id}` : "/api/cards", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await parseApiError(response, t));

    const payload = await response.json();
    const savedCard = payload.card as Card;
    if (editing) {
      setCards((current) =>
        savedCard.isArchived
          ? current.filter((item) => item.id !== savedCard.id)
          : current.map((item) => (item.id === savedCard.id ? savedCard : item)),
      );
      return;
    }

    if (!savedCard.isArchived) {
      setCards((current) => [...current, savedCard].sort((a, b) => a.sortOrder - b.sortOrder));
    }

    fetch("/api/tags")
      .then((res) => res.json())
      .then((tagsPayload) => setTags(tagsPayload.tags || []))
      .catch(() => undefined);
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
        eyebrow={
          isFavouritesView
            ? translateEnglish("pages.favourites.eyebrow")
            : tagParam
              ? translateEnglish("pages.tagFilter.eyebrow")
              : translateEnglish("pages.home.eyebrow")
        }
        title={isFavouritesView ? t("nav.favourites") : tagParam || t("nav.tools")}
        description={
          isFavouritesView
            ? t("pages.favourites.description")
            : tagParam
              ? t("pages.tagFilter.description", { tag: tagParam })
              : t("pages.home.description")
        }
        action={
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground"
            onClick={() => setDialogCard(null)}
            type="button"
          >
            <Plus size={17} aria-hidden="true" />
            {t("pages.home.addNew")}
          </button>
        }
      />
      <FilterBar filters={filters} tags={tags} statusCounts={statusCounts} onChange={updateFilters} />
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
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
              message: t("toast.archived", { name: card.name }),
              actionLabel: t("toast.undo"),
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
