"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AddMoreCard } from "@/components/AddableAppCard";
import { CardDialog } from "@/components/CardDialog";
import { ListCardPicker } from "@/components/ListCardPicker";
import { PageTitle } from "@/components/PageTitle";
import { ToolCard } from "@/components/ToolCard";
import type { FilterState } from "@/components/FilterBar";
import { useTranslation } from "@/components/LocaleProvider";
import { parseApiError, translateEnglish } from "@/lib/i18n";
import { useListKindLabels } from "@/lib/i18n/hooks";
import type { Card, CardInput, SavedList } from "@/lib/types";

const neutralFilters: FilterState = {
  searchQuery: "",
  filterType: "",
  filterTags: [],
  favorite: "",
};

export function ListDetailClient({ id }: { id: string }) {
  const { t } = useTranslation();
  const listKindLabels = useListKindLabels();
  const [list, setList] = useState<SavedList | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCard, setDialogCard] = useState<Card | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) =>
      [card.name, card.url, card.description, card.sourceDomain, card.tags.join(" ")]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [cards, searchQuery]);

  async function refreshList() {
    const [listResponse, cardsResponse] = await Promise.all([
      fetch(`/api/lists/${id}`),
      fetch("/api/cards"),
    ]);

    if (!listResponse.ok) throw new Error(await parseApiError(listResponse, t));
    if (!cardsResponse.ok) throw new Error(await parseApiError(cardsResponse, t));

    const listPayload = await listResponse.json();
    const cardsPayload = await cardsResponse.json();
    setList(listPayload.list);
    setCards(listPayload.cards || []);
    setAllCards(cardsPayload.cards || []);
  }

  useEffect(() => {
    refreshList()
      .catch(() => setError(t("pages.listDetail.loadError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const addableCards = useMemo(() => {
    const currentIds = new Set(cards.map((card) => card.id));
    return allCards.filter((card) => !currentIds.has(card.id));
  }, [allCards, cards]);

  async function addCards(cardIds: string[]) {
    if (!list || !cardIds.length) return;
    const responses = await Promise.all(
      cardIds.map((cardId) => fetch(`/api/lists/${list.id}/cards/${cardId}`, { method: "PUT" })),
    );
    const failed = responses.find((response) => !response.ok);
    if (failed) {
      throw new Error(await parseApiError(failed, t));
    }
    await refreshList();
  }

  async function removeCard(card: Card) {
    if (!list) return;
    const response = await fetch(`/api/lists/${list.id}/cards/${card.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await parseApiError(response, t));
      return;
    }
    await refreshList();
  }

  async function saveCard(input: CardInput) {
    if (!dialogCard) return;

    const response = await fetch(`/api/cards/${dialogCard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      setError(await parseApiError(response, t));
      return;
    }
    await refreshList();
  }

  async function deleteCard(card: Card) {
    const response = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await parseApiError(response, t));
    await refreshList();
  }

  const listDescription = list
    ? list.description
      ? `${listKindLabels[list.kind]} · ${list.description}`
      : listKindLabels[list.kind]
    : t("pages.listDetail.loading");

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow={translateEnglish("pages.listDetail.eyebrow")}
        title={list?.name || t("nav.lists")}
        description={listDescription}
      />
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {!loading && list ? (
        <>
        <div className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("pages.manage.searchPlaceholder")}
            className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-ring"
          />
        </div>
        {filteredCards.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCards.map((card) => (
              <ToolCard
                key={card.id}
                card={card}
                filters={neutralFilters}
                onFavorite={async (item) => {
                  const nextFavorite = !item.isFavorite;
                  await fetch(`/api/cards/${item.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isFavorite: nextFavorite }),
                  });
                  await refreshList();
                }}
                onArchive={async (item) => {
                  await fetch(`/api/cards/${item.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isArchived: true }),
                  });
                  await refreshList();
                }}
                onEdit={(item) => setDialogCard(item)}
                onDelete={list.kind === "manual" ? removeCard : undefined}
              />
            ))}
            {list.kind === "manual" && addableCards.length ? (
              <AddMoreCard
                title={t("pages.listDetail.addMore")}
                hint={t("pages.listDetail.addMoreHint")}
                onClick={() => setPickerOpen(true)}
              />
            ) : null}
          </div>
        ) : searchQuery ? (
          <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
            {t("pages.listDetail.pickerNoMatch")}
          </div>
        ) : list.kind === "manual" && addableCards.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AddMoreCard
              title={t("pages.listDetail.addMore")}
              hint={t("pages.listDetail.addMoreHint")}
              onClick={() => setPickerOpen(true)}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
            {list.kind === "manual" ? t("pages.listDetail.pickerEmpty") : t("cardGrid.empty")}
          </div>
        )}
        </>
      ) : null}
      {dialogCard !== undefined ? (
        <CardDialog
          card={dialogCard}
          onClose={() => setDialogCard(undefined)}
          onSubmit={saveCard}
          onDelete={dialogCard ? deleteCard : undefined}
        />
      ) : null}
      {pickerOpen && list ? (
        <ListCardPicker
          listName={list.name}
          cards={addableCards}
          onClose={() => setPickerOpen(false)}
          onConfirm={addCards}
        />
      ) : null}
    </div>
  );
}
