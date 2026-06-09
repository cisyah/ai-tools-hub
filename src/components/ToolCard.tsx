"use client";

import { Archive, ExternalLink, GripVertical, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import { CardPreviewVisual } from "@/components/CardPreviewVisual";
import type { FilterState } from "@/components/FilterBar";
import { useTranslation } from "@/components/LocaleProvider";
import { getPlatformSourceLabel } from "@/lib/platform-source";
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
  sortMode?: boolean;
};

export function ToolCard({ card, filters, onArchive, onRestore, onFavorite, onEdit, onDelete, showRestore, sortMode }: ToolCardProps) {
  const { t } = useTranslation();
  const sourceLabel = getPlatformSourceLabel(card.url, card.sourceDomain, t("platformSources.other"));

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

  const actionButton = "flex h-8 w-8 items-center justify-center rounded-full text-app-card-muted transition hover:bg-surface-strong hover:text-app-card-foreground";
  const tagOverlay = card.tags.length ? (
    <div className="absolute bottom-3 right-3 flex max-w-[calc(100%-1.5rem)] flex-wrap justify-end gap-1.5">
      {card.tags.slice(0, 3).map((tag) => (
        <span key={tag} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-app-card-foreground/75 shadow-sm backdrop-blur-md">
          {tag}
        </span>
      ))}
    </div>
  ) : null;

  const cardBody = (
    <>
      <div className="relative">
        <CardPreviewVisual
          previewUrl={card.previewUrl}
          previewPosition={card.previewPosition}
          icon={card.icon}
          imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
        />
        {tagOverlay}
      </div>
      <div className="px-4 pb-4 pt-4">
        <div className="relative">
          <div className="truncate text-base font-bold leading-tight tracking-normal text-[#454545]">{card.name}</div>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-app-card-muted">{card.description}</p>
        </div>
      </div>
    </>
  );

  return (
    <article
      className={`group overflow-hidden rounded-lg border-[0.5px] border-app-card-border bg-app-card-surface text-app-card-foreground transition duration-200 hover:border-app-card-foreground/25 ${
        sortMode ? "cursor-grab shadow-[0_0_0_1px_var(--border)] active:cursor-grabbing" : "hover:-translate-y-0.5"
      }`}
    >
      {sortMode ? (
        <div className="block w-full text-left">{cardBody}</div>
      ) : (
        <button onClick={openCard} className="block w-full text-left">
          {cardBody}
        </button>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-[#EEECE5] bg-app-card-surface px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-app-card-muted">
          <span className="inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-accent-soft px-2.5 text-[11px] font-normal leading-none text-foreground">
            {sourceLabel}
          </span>
          <span className="truncate font-normal text-app-card-muted">{card.sourceDomain || card.url}</span>
        </div>
        {sortMode ? (
          <div className="flex shrink-0 items-center gap-1 text-app-card-muted" title={t("toolCard.dragToSort")} aria-label={t("toolCard.dragToSort")}>
            <GripVertical size={16} aria-hidden="true" />
          </div>
        ) : (
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
        )}
      </div>
    </article>
  );
}
