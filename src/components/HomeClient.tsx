"use client";

import { ArrowUpDown, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddMoreCard } from "@/components/AddableAppCard";
import { CardDialog } from "@/components/CardDialog";
import { CardGrid } from "@/components/CardGrid";
import { FavoriteCardPicker } from "@/components/FavoriteCardPicker";
import { FilterBar, type FilterState } from "@/components/FilterBar";
import { PageTitle } from "@/components/PageTitle";
import { ToolCard } from "@/components/ToolCard";
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
  const haystack = [card.name, card.description, card.url, card.sourceDomain, card.notes, ...card.tags].join(" ").toLowerCase();
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
  const [favoritePickerOpen, setFavoritePickerOpen] = useState(false);
  const [sortMode, setSortMode] = useState(false);
  const [sortSaving, setSortSaving] = useState(false);
  const { showToast } = useToast();
  const storedFiltersLoaded = useRef(false);

  const tagParam = searchParams.getAll("tag").map((t) => t.trim()).filter(Boolean).join(", ");
  const isFavouritesView = searchParams.get("favorite") === "favorite";

  useEffect(() => {
    if (isFavouritesView) setSortMode(false);
  }, [isFavouritesView]);

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
    const nextTags = searchParams.getAll("tag").map((t) => t.trim()).filter(Boolean);
    const urlFilters: Pick<FilterState, "favorite" | "filterTags"> = {
      favorite: searchParams.get("favorite") === "favorite" ? "favorite" : searchParams.get("favorite") === "normal" ? "normal" : "",
      filterTags: nextTags,
    };

    if (!storedFiltersLoaded.current) {
      storedFiltersLoaded.current = true;
      let base = defaultFilters;
      const saved = window.localStorage.getItem("ai-tools-hub.filters");
      if (saved) {
        try {
          base = { ...defaultFilters, ...(JSON.parse(saved) as FilterState), filterType: "" };
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
    const cleanNext = { ...next, filterType: "" };
    setFilters(cleanNext);

    const params = new URLSearchParams();
    if (cleanNext.favorite === "favorite") params.set("favorite", "favorite");
    else if (cleanNext.favorite === "normal") params.set("favorite", "normal");
    if (cleanNext.filterTags.length) {
      for (const tag of cleanNext.filterTags) {
        params.append("tag", tag);
      }
    }

    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        if (filters.favorite === "favorite" && !card.isFavorite) return false;
        if (filters.favorite === "normal" && card.isFavorite) return false;
        if (!matchesSearch(card, filters.searchQuery.trim())) return false;
        return filters.filterTags.every((tag) => card.tags.includes(tag));
      }),
    [cards, filters],
  );

  const favoriteCandidateCards = useMemo(
    () =>
      cards.filter((card) => {
        if (card.isFavorite) return false;
        if (!matchesSearch(card, filters.searchQuery.trim())) return false;
        return filters.filterTags.every((tag) => card.tags.includes(tag));
      }),
    [cards, filters.filterTags, filters.searchQuery],
  );

  const statusCounts = useMemo(() => {
    const baseCards = cards.filter((card) => {
      if (!matchesSearch(card, filters.searchQuery.trim())) return false;
      return filters.filterTags.every((tag) => card.tags.includes(tag));
    });

    return {
      all: baseCards.length,
      favorite: baseCards.filter((card) => card.isFavorite).length,
      normal: baseCards.filter((card) => !card.isFavorite).length,
    };
  }, [cards, filters.filterTags, filters.searchQuery]);

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

  async function setCardFavorite(card: Card, nextFavorite: boolean) {
    const response = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: nextFavorite }),
    });
    if (!response.ok) throw new Error(await parseApiError(response, t));
    setCards((current) => current.map((item) => (item.id === card.id ? { ...item, isFavorite: nextFavorite } : item)));
  }

  async function addFavoriteCards(cardIds: string[]) {
    if (!cardIds.length) return;
    setError("");
    try {
      const selectedIds = new Set(cardIds);
      const responses = await Promise.all(
        cardIds.map((cardId) =>
          fetch(`/api/cards/${cardId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFavorite: true }),
          }),
        ),
      );
      const failed = responses.find((response) => !response.ok);
      if (failed) throw new Error(await parseApiError(failed, t));
      setCards((current) => current.map((card) => (selectedIds.has(card.id) ? { ...card, isFavorite: true } : card)));
      router.replace("/?favorite=favorite", { scroll: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.listDetail.pickerAddError"));
      throw err;
    }
  }

  async function reorderVisibleCards(nextVisibleCards: Card[]) {
    const visibleIds = new Set(nextVisibleCards.map((card) => card.id));
    const visibleQueue = [...nextVisibleCards];
    const nextCards = cards
      .map((card) => (visibleIds.has(card.id) ? visibleQueue.shift() || card : card))
      .map((card, index) => ({ ...card, sortOrder: (index + 1) * 10 }));
    const previousCards = cards;

    setCards(nextCards);
    setSortSaving(true);
    setError("");

    try {
      const response = await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds: nextCards.map((card) => card.id) }),
      });
      if (!response.ok) throw new Error(await parseApiError(response, t));
      const payload = await response.json();
      setCards(payload.cards || nextCards);
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : t("errors.saveFailed"));
    } finally {
      setSortSaving(false);
    }
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
        title={isFavouritesView ? t("nav.favourites") : tagParam || t("pages.home.title")}
        description={
          isFavouritesView
            ? t("pages.favourites.description")
            : tagParam
              ? t("pages.tagFilter.description", { tag: tagParam })
              : t("pages.home.description")
        }
        action={
          isFavouritesView ? null : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className={`flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                  sortMode
                    ? "border-primary bg-accent-soft text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
                onClick={() => setSortMode((current) => !current)}
                type="button"
                disabled={sortSaving}
              >
                <ArrowUpDown size={17} aria-hidden="true" />
                {sortMode ? (sortSaving ? t("common.saving") : t("pages.home.sortDone")) : t("pages.home.sort")}
              </button>
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground"
                onClick={() => setDialogCard(null)}
                type="button"
              >
                <Plus size={17} aria-hidden="true" />
                {t("pages.home.addNew")}
              </button>
            </div>
          )
        }
      />
      <FilterBar filters={filters} tags={tags} statusCounts={statusCounts} showFavoriteFilter={false} onChange={updateFilters} />
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {!loading && !error ? (
        isFavouritesView ? (
          <div className="space-y-4">
            {filteredCards.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCards.map((card) => (
                  <ToolCard
                    key={card.id}
                    card={card}
                    filters={filters}
                    onArchive={async (item) => {
                      await fetch(`/api/cards/${item.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isArchived: true }),
                      });
                      setCards((current) => current.filter((entry) => entry.id !== item.id));
                      showToast({
                        message: t("toast.archived", { name: item.name }),
                        actionLabel: t("toast.undo"),
                        onAction: async () => {
                          await fetch(`/api/cards/${item.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isArchived: false }),
                          });
                          setCards((current) => [...current, { ...item, isArchived: false }].sort((a, b) => a.sortOrder - b.sortOrder));
                        },
                      });
                    }}
                    onFavorite={(item) => {
                      void setCardFavorite(item, !item.isFavorite).catch((err) =>
                        setError(err instanceof Error ? err.message : t("pages.home.loadError")),
                      );
                    }}
                    onEdit={(item) => setDialogCard(item)}
                  />
                ))}
                {favoriteCandidateCards.length > 0 ? (
                  <AddMoreCard
                    title={t("pages.listDetail.addMore")}
                    hint={t("pages.favourites.addMoreHint")}
                    onClick={() => setFavoritePickerOpen(true)}
                  />
                ) : null}
              </div>
            ) : null}
            {!filteredCards.length && favoriteCandidateCards.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AddMoreCard
                  title={t("pages.listDetail.addMore")}
                  hint={t("pages.favourites.addMoreHint")}
                  onClick={() => setFavoritePickerOpen(true)}
                />
              </div>
            ) : null}
            {!filteredCards.length && !favoriteCandidateCards.length ? (
              <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
                {t("cardGrid.empty")}
              </div>
            ) : null}
          </div>
        ) : (
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
              await setCardFavorite(card, !card.isFavorite);
            }}
            onEdit={(card) => setDialogCard(card)}
            sortMode={sortMode}
            sortSaving={sortSaving}
            onReorder={reorderVisibleCards}
          />
        )
      ) : null}
      {dialogCard !== undefined ? (
        <CardDialog
          card={dialogCard}
          onClose={() => setDialogCard(undefined)}
          onSubmit={saveCard}
          onDelete={dialogCard ? deleteCard : undefined}
        />
      ) : null}
      {favoritePickerOpen ? (
        <FavoriteCardPicker
          cards={favoriteCandidateCards}
          onClose={() => setFavoritePickerOpen(false)}
          onConfirm={addFavoriteCards}
        />
      ) : null}
    </div>
  );
}
