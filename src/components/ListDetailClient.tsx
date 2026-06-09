"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CardDialog } from "@/components/CardDialog";
import { CardGrid } from "@/components/CardGrid";
import { ListCardPicker } from "@/components/ListCardPicker";
import { PageTitle } from "@/components/PageTitle";
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

  async function refreshList() {
    const [listResponse, cardsResponse] = await Promise.all([
      fetch(`/api/lists/${id}`),
      fetch("/api/cards?includeArchived=1"),
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
    ? `${listKindLabels[list.kind]} · ${list.description || t("common.noDescription")}`
    : t("pages.listDetail.loading");

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow={translateEnglish("pages.listDetail.eyebrow")}
        title={list?.name || t("nav.lists")}
        description={listDescription}
        before={
          <Link href="/lists" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("pages.listDetail.back")}
          </Link>
        }
      />
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {list?.kind === "manual" ? (
        <button
          className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          onClick={() => setPickerOpen(true)}
        >
          <Plus size={16} />
          {t("pages.listDetail.addToList")}
        </button>
      ) : null}
      {!loading && list ? (
        <CardGrid
          cards={cards}
          filters={neutralFilters}
          onFavorite={async (card) => {
            const nextFavorite = !card.isFavorite;
            await fetch(`/api/cards/${card.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isFavorite: nextFavorite }),
            });
            await refreshList();
          }}
          onArchive={async (card) => {
            await fetch(`/api/cards/${card.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isArchived: true }),
            });
            await refreshList();
          }}
          onEdit={(card) => setDialogCard(card)}
          onDelete={list.kind === "manual" ? removeCard : undefined}
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
