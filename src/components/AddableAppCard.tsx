"use client";

import { Plus } from "lucide-react";
import { CardPreviewVisual } from "@/components/CardPreviewVisual";
import { useTranslation } from "@/components/LocaleProvider";
import { getPlatformSourceLabel } from "@/lib/platform-source";
import type { Card } from "@/lib/types";

type AddableAppCardProps = {
  card: Card;
  adding: boolean;
  addLabel: string;
  addingLabel: string;
  addAriaLabel: string;
  onAdd: (card: Card) => void;
};

export function AddableAppCard({
  card,
  adding,
  addLabel,
  addingLabel,
  addAriaLabel,
  onAdd,
}: AddableAppCardProps) {
  const { t } = useTranslation();
  const sourceLabel = getPlatformSourceLabel(card.url, card.sourceDomain, t("platformSources.other"));

  return (
    <article className="group overflow-hidden rounded-lg border-[0.5px] border-app-card-border bg-app-card-surface text-app-card-foreground transition duration-200 hover:-translate-y-0.5 hover:border-app-card-foreground/25">
      <div className="relative">
        <CardPreviewVisual
          previewUrl={card.previewUrl}
          previewPosition={card.previewPosition}
          icon={card.icon}
          imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
        />
        <button
          type="button"
          disabled={adding}
          onClick={() => onAdd(card)}
          className="absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover hover:text-primary-hover-foreground disabled:opacity-65"
          aria-label={addAriaLabel}
        >
          <Plus size={15} />
          {adding ? addingLabel : addLabel}
        </button>
      </div>
      <div className="px-4 pb-4 pt-4">
        <div className="truncate text-base font-bold leading-tight tracking-normal text-[#454545]">{card.name}</div>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-app-card-muted">{card.description}</p>
      </div>
      <div className="flex items-center gap-2 border-t border-[#EEECE5] bg-app-card-surface px-3 py-2 text-xs text-app-card-muted">
        <span className="inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-accent-soft px-2.5 text-[11px] font-normal leading-none text-foreground">
          {sourceLabel}
        </span>
        <span className="truncate font-normal text-app-card-muted">{card.sourceDomain || card.url}</span>
      </div>
    </article>
  );
}

export function AddMoreCard({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[286px] flex-col items-center justify-center rounded-lg border border-dashed border-app-card-border bg-surface px-5 text-center text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:bg-accent-soft"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Plus size={22} />
      </span>
      <span className="mt-4 text-base font-bold">{title}</span>
      <span className="mt-2 max-w-48 text-sm leading-5 text-muted-foreground">{hint}</span>
    </button>
  );
}
