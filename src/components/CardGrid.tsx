"use client";

import { useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import type { FilterState } from "@/components/FilterBar";
import { useTranslation } from "@/components/LocaleProvider";
import type { Card } from "@/lib/types";

type CardGridProps = {
  cards: Card[];
  filters: FilterState;
  onArchive?: (card: Card) => void;
  onRestore?: (card: Card) => void;
  onFavorite?: (card: Card) => void;
  onEdit?: (card: Card) => void;
  onDelete?: (card: Card) => void;
  showRestore?: boolean;
  sortMode?: boolean;
  sortSaving?: boolean;
  onReorder?: (cards: Card[]) => void;
};

function moveCard(cards: Card[], activeId: string, targetId: string) {
  const activeIndex = cards.findIndex((card) => card.id === activeId);
  const targetIndex = cards.findIndex((card) => card.id === targetId);
  if (activeIndex < 0 || targetIndex < 0 || activeIndex === targetIndex) return cards;

  const nextCards = [...cards];
  const [activeCard] = nextCards.splice(activeIndex, 1);
  nextCards.splice(targetIndex, 0, activeCard);
  return nextCards;
}

export function CardGrid({ cards, filters, onArchive, onRestore, onFavorite, onEdit, onDelete, showRestore, sortMode, sortSaving, onReorder }: CardGridProps) {
  const { t } = useTranslation();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!sortMode || !draggingId) return;
    const nextCards = moveCard(cards, draggingId, targetId);
    setDraggingId(null);
    setDragOverId(null);
    if (nextCards !== cards) onReorder?.(nextCards);
  }

  if (!cards.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
        {t("cardGrid.empty")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          draggable={sortMode && !sortSaving}
          onDragStart={(event) => {
            if (!sortMode || sortSaving) return;
            setDraggingId(card.id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", card.id);
          }}
          onDragEnter={(event) => {
            if (!sortMode || !draggingId || draggingId === card.id) return;
            event.preventDefault();
            setDragOverId(card.id);
          }}
          onDragOver={(event) => {
            if (!sortMode || !draggingId) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDragLeave={() => {
            if (dragOverId === card.id) setDragOverId(null);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop(card.id);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDragOverId(null);
          }}
          className={`rounded-lg transition ${dragOverId === card.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${
            draggingId === card.id ? "opacity-60" : ""
          }`}
        >
          <ToolCard
            card={card}
            filters={filters}
            onArchive={onArchive}
            onRestore={onRestore}
            onFavorite={onFavorite}
            onEdit={onEdit}
            onDelete={onDelete}
            showRestore={showRestore}
            sortMode={sortMode}
          />
        </div>
      ))}
    </div>
  );
}
