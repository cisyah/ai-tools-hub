"use client";

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
};

export function CardGrid({ cards, filters, onArchive, onRestore, onFavorite, onEdit, onDelete, showRestore }: CardGridProps) {
  const { t } = useTranslation();

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
        <ToolCard
          key={card.id}
          card={card}
          filters={filters}
          onArchive={onArchive}
          onRestore={onRestore}
          onFavorite={onFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
          showRestore={showRestore}
        />
      ))}
    </div>
  );
}
