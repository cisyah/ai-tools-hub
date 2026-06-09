"use client";

import { Archive, ExternalLink, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import { CardPreviewVisual } from "@/components/CardPreviewVisual";
import type { FilterState } from "@/components/FilterBar";
import { useTranslation } from "@/components/LocaleProvider";
import { useCardTypeLabels } from "@/lib/i18n/hooks";
import type { Card } from "@/lib/types";

type ToolCardProps = {
  card: Card;
  filters: FilterState;
  onArchive?: (card: Card) => void;
  onRestore?: (card: Card) => void;
  onFavorite?: (card: Card) => void;
  onEdit?: (card: Card) => void;
  onDelete?: (card: Card) => void;
  showRestore?: boolean;
};

export function ToolCard({ card, filters, onArchive, onRestore, onFavorite, onEdit, onDelete, showRestore }: ToolCardProps) {
  const { t } = useTranslation();
  const cardTypeLabels = useCardTypeLabels();

  function openCard() {
    void fetch("/api/cards/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.id,
        cardType: card.type,
        searchQuery: filters.searchQuery,
        filterType: filters.filterType,
        filterTags: filters.filterTags,
      }),
    }).catch(() => undefined);

    window.open(card.url, "_blank", "noopener,noreferrer");
  }

  const actionButton = "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-surface-strong hover:text-foreground";
  const tagOverlay = card.tags.length ? (
    <div className="absolute bottom-3 right-3 flex max-w-[calc(100%-1.5rem)] flex-wrap justify-end gap-1.5">
      {card.tags.slice(0, 3).map((tag) => (
        <span key={tag} className="rounded-full bg-white/75 px-2 py-0.5 text-[11px] font-semibold text-foreground/75 shadow-sm backdrop-blur-md">
          {tag}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <article className="group overflow-hidden rounded-lg border-[0.5px] border-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-foreground/25">
      <button onClick={openCard} className="block w-full text-left">
        <div className="relative">
          <CardPreviewVisual
            previewUrl={card.previewUrl}
            icon={card.icon}
            imageClassName="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.025]"
          />
          {tagOverlay}
        </div>
        <div className="px-4 pb-4 pt-4">
          <div className="relative">
            <div className="truncate text-base font-bold leading-tight tracking-normal">{card.name}</div>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{card.description}</p>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-background/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0 rounded-full bg-surface-strong px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {cardTypeLabels[card.type]}
          </span>
          <span className="truncate font-semibold text-foreground/75">{card.sourceDomain || card.url}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button className={actionButton} onClick={() => onFavorite?.(card)} aria-label={t("toolCard.toggleFavourite")}>
            <Star size={16} className={card.isFavorite ? "fill-accent text-accent" : ""} />
          </button>
          {showRestore ? (
            <button className={actionButton} onClick={() => onRestore?.(card)} aria-label={t("toolCard.restore")}>
              <RotateCcw size={16} />
            </button>
          ) : (
            <button className={actionButton} onClick={() => onArchive?.(card)} aria-label={t("toolCard.archive")}>
              <Archive size={16} />
            </button>
          )}
          {onEdit ? (
            <button className={actionButton} onClick={() => onEdit(card)} aria-label={t("toolCard.edit")}>
              <Pencil size={16} />
            </button>
          ) : null}
          {onDelete ? (
            <button className={actionButton} onClick={() => onDelete(card)} aria-label={t("toolCard.delete")}>
              <Trash2 size={16} />
            </button>
          ) : null}
          <button className={actionButton} onClick={openCard} aria-label={t("toolCard.open")}>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
