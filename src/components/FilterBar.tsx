"use client";

import { Check, Search, Tags, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CardTypeSelect } from "@/components/CardTypeSelect";
import { useTranslation } from "@/components/LocaleProvider";
import type { CardType, FavoriteFilter, TagCount } from "@/lib/types";

export type FilterState = {
  searchQuery: string;
  filterType: CardType | "";
  filterTags: string[];
  favorite: FavoriteFilter;
};

type FilterBarProps = {
  filters: FilterState;
  tags: TagCount[];
  statusCounts?: {
    all: number;
    favorite: number;
    normal: number;
  };
  onChange: (filters: FilterState) => void;
};

export function FilterBar({ filters, tags, statusCounts, onChange }: FilterBarProps) {
  const { t } = useTranslation();
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tagMenuOpen) return;

    function closeOnOutside(event: MouseEvent) {
      if (!tagMenuRef.current?.contains(event.target as Node)) {
        setTagMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTagMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [tagMenuOpen]);

  function toggleTag(tag: string) {
    const exists = filters.filterTags.includes(tag);
    onChange({
      ...filters,
      filterTags: exists ? filters.filterTags.filter((item) => item !== tag) : [...filters.filterTags, tag],
    });
  }

  return (
    <section className="space-y-2 border-y border-border py-2.5">
      <div className="grid gap-2 xl:grid-cols-[minmax(280px,1fr)_180px_132px_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
          <input
            value={filters.searchQuery}
            onChange={(event) => onChange({ ...filters, searchQuery: event.target.value })}
            className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-ring"
            placeholder={t("filter.searchPlaceholder")}
          />
        </label>
        <CardTypeSelect
          value={filters.filterType}
          onChange={(nextValue) => onChange({ ...filters, filterType: nextValue })}
          includeAllOption
          allOptionLabel={t("filter.allTypes")}
          ariaLabel={t("filter.typeAria")}
        />
        <div ref={tagMenuRef} className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={tagMenuOpen}
            className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm transition ${
              filters.filterTags.length
                ? "border-accent bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            }`}
            onClick={() => setTagMenuOpen((current) => !current)}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <Tags size={15} />
              {t("filter.tags")}
            </span>
            <span className="text-xs text-current/70">{filters.filterTags.length || tags.length}</span>
          </button>
          {tagMenuOpen ? (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-2xl">
              {tags.map((tag) => {
                const selected = filters.filterTags.includes(tag.name);
                return (
                  <button
                    key={tag.name}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm transition ${
                      selected ? "bg-surface-strong text-foreground" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
                    }`}
                    onClick={() => toggleTag(tag.name)}
                  >
                    <Check size={15} className={selected ? "opacity-100" : "opacity-0"} />
                    <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                    <span className="text-xs text-current/55">{tag.count}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="flex h-10 rounded-md border border-border bg-surface p-1">
          {[
            { value: "", label: t("filter.all"), count: statusCounts?.all },
            { value: "favorite", label: t("filter.favourite"), count: statusCounts?.favorite },
            { value: "normal", label: t("filter.normal"), count: statusCounts?.normal },
          ].map((item) => (
            <button
              key={item.value || "all"}
              className={`flex min-w-16 items-center justify-center gap-1.5 rounded px-3 text-xs font-semibold transition ${
                filters.favorite === item.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
              }`}
              onClick={() => onChange({ ...filters, favorite: item.value as FavoriteFilter })}
            >
              <span>{item.label}</span>
              {typeof item.count === "number" ? <span className="text-current/60">{item.count}</span> : null}
            </button>
          ))}
        </div>
        {filters.filterTags.length || filters.searchQuery || filters.filterType || filters.favorite ? (
          <button
            className="flex h-10 items-center justify-center gap-1 rounded-md border border-border bg-surface px-3 text-xs text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
            onClick={() => onChange({ searchQuery: "", filterType: "", filterTags: [], favorite: "" })}
          >
            <X size={14} aria-hidden="true" />
            {t("filter.clear")}
          </button>
        ) : null}
      </div>
      {filters.filterTags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {filters.filterTags.map((tag) => (
            <button
              key={tag}
              className="flex min-h-7 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-xs text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
