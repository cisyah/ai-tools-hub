"use client";

import { Archive, ExternalLink, Pencil, RotateCcw, Star, Trash2 } from "lucide-react";
import { CardIcon } from "@/components/icons";
import type { FilterState } from "@/components/FilterBar";
import { cardTypeLabels, type Card } from "@/lib/types";

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
    <article className="group overflow-hidden rounded-lg border border-border bg-surface shadow-airbnb transition duration-200 hover:-translate-y-0.5 hover:border-foreground/25">
      <button onClick={openCard} className="block w-full text-left">
        {card.previewUrl ? (
          <div className="relative h-36 bg-muted sm:h-40">
            <img src={card.previewUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
            <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground backdrop-blur">
              Preview
            </div>
            {tagOverlay}
          </div>
        ) : (
          <div className="relative flex h-36 items-center justify-center bg-[linear-gradient(135deg,var(--accent-soft),#ffffff)] text-foreground sm:h-40">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-white">
              <CardIcon name={card.icon} size={28} />
            </div>
            {tagOverlay}
          </div>
        )}
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
          <button className={actionButton} onClick={() => onFavorite?.(card)} aria-label="切换星标">
            <Star size={16} className={card.isFavorite ? "fill-primary text-primary" : ""} />
          </button>
          {showRestore ? (
            <button className={actionButton} onClick={() => onRestore?.(card)} aria-label="恢复">
              <RotateCcw size={16} />
            </button>
          ) : (
            <button className={actionButton} onClick={() => onArchive?.(card)} aria-label="归档">
              <Archive size={16} />
            </button>
          )}
          {onEdit ? (
            <button className={actionButton} onClick={() => onEdit(card)} aria-label="编辑">
              <Pencil size={16} />
            </button>
          ) : null}
          {onDelete ? (
            <button className={actionButton} onClick={() => onDelete(card)} aria-label="删除">
              <Trash2 size={16} />
            </button>
          ) : null}
          <button className={actionButton} onClick={openCard} aria-label="打开">
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
