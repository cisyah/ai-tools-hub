"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CardDialog } from "@/components/CardDialog";
import { CardGrid } from "@/components/CardGrid";
import { PageTitle } from "@/components/PageTitle";
import { SelectMenu } from "@/components/SelectMenu";
import type { FilterState } from "@/components/FilterBar";
import type { Card, CardInput, ListKind, SavedList } from "@/lib/types";

const listKindNames: Record<ListKind, string> = {
  manual: "Manual list",
  smart: "Smart list",
};

const neutralFilters: FilterState = {
  searchQuery: "",
  filterType: "",
  filterTags: [],
  favorite: "",
};

async function parseApiError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error || "请求失败。";
}

export function ListDetailClient({ id }: { id: string }) {
  const [list, setList] = useState<SavedList | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCard, setDialogCard] = useState<Card | null | undefined>(undefined);

  async function refreshList() {
    const [listResponse, cardsResponse] = await Promise.all([
      fetch(`/api/lists/${id}`),
      fetch("/api/cards?includeArchived=1"),
    ]);

    if (!listResponse.ok) throw new Error(await parseApiError(listResponse));
    if (!cardsResponse.ok) throw new Error(await parseApiError(cardsResponse));

    const listPayload = await listResponse.json();
    const cardsPayload = await cardsResponse.json();
    setList(listPayload.list);
    setCards(listPayload.cards || []);
    setAllCards(cardsPayload.cards || []);
  }

  useEffect(() => {
    refreshList()
      .catch(() => setError("加载列表详情失败，请确认数据库已初始化。"))
      .finally(() => setLoading(false));
  }, [id]);

  const addableCards = useMemo(() => {
    const currentIds = new Set(cards.map((card) => card.id));
    return allCards.filter((card) => !currentIds.has(card.id));
  }, [allCards, cards]);

  async function addCard() {
    if (!selectedCardId || !list) return;
    const response = await fetch(`/api/lists/${list.id}/cards/${selectedCardId}`, { method: "PUT" });
    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }
    setSelectedCardId("");
    await refreshList();
  }

  async function removeCard(card: Card) {
    if (!list) return;
    const response = await fetch(`/api/lists/${list.id}/cards/${card.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await parseApiError(response));
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
      setError(await parseApiError(response));
      return;
    }
    await refreshList();
  }

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow="List Detail"
        title={list?.name || "List"}
        description={list ? `${listKindNames[list.kind]} · ${list.description || "No description"}` : "Loading..."}
        before={
          <Link href="/lists" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to Lists
          </Link>
        }
      />
      {loading ? <div className="text-sm text-muted-foreground">加载中...</div> : null}
      {error ? <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {list?.kind === "manual" ? (
        <div className="grid gap-2 rounded-[20px] bg-surface p-3 shadow-airbnb sm:grid-cols-[1fr_auto]">
          <SelectMenu
            value={selectedCardId}
            onChange={setSelectedCardId}
            options={[
              { value: "", label: "选择要加入的卡片" },
              ...addableCards.map((card) => ({ value: card.id, label: card.name })),
            ]}
            buttonClassName="rounded-full"
            menuClassName="rounded-xl"
            ariaLabel="选择要加入的卡片"
          />
          <button
            className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            disabled={!selectedCardId}
            onClick={addCard}
          >
            加入列表
          </button>
        </div>
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
      {dialogCard !== undefined ? <CardDialog card={dialogCard} onClose={() => setDialogCard(undefined)} onSubmit={saveCard} /> : null}
    </div>
  );
}
