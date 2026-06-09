"use client";

import { ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CardPreviewVisual } from "@/components/CardPreviewVisual";
import { NameCreateDialog } from "@/components/NameCreateDialog";
import { PageTitle } from "@/components/PageTitle";
import { useTranslation } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastProvider";
import { parseApiError, translateApiError, translateEnglish } from "@/lib/i18n";
import type { Card, TagCount } from "@/lib/types";

type TagManagerPanelProps = {
  showTitle?: boolean;
};

export function TagManagerPanel({ showTitle = false }: TagManagerPanelProps) {
  const { t } = useTranslation();
  const [tags, setTags] = useState<TagCount[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  async function refreshTags() {
    const response = await fetch("/api/tags?includeArchived=1");
    if (!response.ok) throw new Error(await parseApiError(response, t));
    const payload = await response.json();
    setTags(payload.tags || []);
  }

  async function refreshCards() {
    const response = await fetch("/api/cards?includeArchived=1");
    if (!response.ok) throw new Error(await parseApiError(response, t));
    const payload = await response.json();
    setCards(payload.cards || []);
  }

  async function refreshTagData() {
    await Promise.all([refreshTags(), refreshCards()]);
  }

  useEffect(() => {
    refreshTagData()
      .catch(() => setError(t("pages.tags.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    setRenameValue(selectedTag);
    setDeleteConfirm(false);
  }, [selectedTag]);

  const filteredTags = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [searchQuery, tags]);

  const selected = useMemo(
    () => (selectedTag ? tags.find((tag) => tag.name === selectedTag) : undefined),
    [selectedTag, tags],
  );

  const selectedCards = useMemo(
    () => (selected ? cards.filter((card) => card.tags.includes(selected.name)) : []),
    [cards, selected],
  );

  useEffect(() => {
    if (!selected) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedTag("");
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  async function addTag(inputName: string) {
    const name = inputName.trim();
    if (!name) {
      setError(t("errors.tagNameRequired"));
      return;
    }

    setSaving(true);
    setError("");

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setSaving(false);

    if (!response.ok) {
      const message = await parseApiError(response, t);
      setError(message);
      throw new Error(message);
    }

    await refreshTags();
    setSelectedTag(name);
    showToast({ message: t("toast.tagAdded", { name }) });
  }

  async function saveRename() {
    if (!selected) return;
    const newName = renameValue.trim();
    if (!newName) {
      setError(t("errors.tagNameRequired"));
      return;
    }
    if (newName === selected.name) return;

    setSaving(true);
    setError("");

    const response = await fetch("/api/tags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName: selected.name, newName }),
    });

    setSaving(false);

    if (!response.ok) {
      setError(await parseApiError(response, t));
      return;
    }

    await refreshTagData();
    setSelectedTag(newName);
    showToast({ message: t("toast.tagRenamed", { oldName: selected.name, newName }) });
  }

  async function removeTag() {
    if (!selected) return;

    setSaving(true);
    setError("");

    const response = await fetch(`/api/tags?name=${encodeURIComponent(selected.name)}`, { method: "DELETE" });

    setSaving(false);

    if (!response.ok) {
      setError(await parseApiError(response, t));
      return;
    }

    await refreshTagData();
    setSelectedTag("");
    showToast({ message: t("toast.tagRemoved", { name: selected.name }) });
  }

  const renameDirty = selected ? renameValue.trim() !== selected.name : false;

  return (
    <div className="space-y-5">
      {showTitle ? (
        <PageTitle
          eyebrow={translateEnglish("pages.tags.eyebrow")}
          title={t("nav.tags")}
          description={t("pages.tags.pageDescription")}
        />
      ) : null}

      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{translateApiError(error, t)}</div> : null}

      <section className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-ring"
              placeholder={t("pages.tags.searchPlaceholder")}
            />
          </label>
          <button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground"
          >
            <Plus size={17} aria-hidden="true" />
            {t("pages.tags.addTag")}
          </button>
        </div>
        {tags.length ? (
          <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("pages.tags.showing", { filtered: filteredTags.length, total: tags.length })}</span>
            <span>{t("pages.tags.sortedBy")}</span>
          </div>
          {filteredTags.length ? (
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => {
                const active = selectedTag === tag.name;
                return (
                  <button
                    key={tag.name}
                    type="button"
                    className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? "border-primary/30 bg-accent-soft text-foreground shadow-sm"
                        : "border-border bg-background/70 text-foreground hover:border-ring hover:bg-surface-strong"
                    }`}
                    onClick={() => setSelectedTag(tag.name)}
                  >
                    <span className="min-w-0 truncate">{tag.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                        active ? "bg-background/70 text-foreground" : "bg-surface-strong text-muted-foreground"
                      }`}
                    >
                      {tag.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-1 py-6 text-sm text-muted-foreground">{t("pages.tags.noMatch")}</div>
          )}
          </>
        ) : null}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="flex h-[88vh] max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-6">
              <div className="min-w-0 space-y-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.tags.selected")}</div>
                <h2 className="break-words text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">{t("pages.tags.cardsUsing", { count: selected.count })}</p>
              </div>
              <button
                type="button"
                className="rounded-md p-2 hover:bg-surface-strong"
                onClick={() => setSelectedTag("")}
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-6 pb-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-h-0">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-[0.16em]">{t("pages.tags.containedCards")}</span>
                  <span>{selectedCards.length}</span>
                </div>
                {selectedCards.length ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {selectedCards.map((card) => (
                      <a
                        key={card.id}
                        href={card.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-lg border-[0.5px] border-app-card-border bg-app-card-surface text-left text-app-card-foreground transition duration-200 hover:-translate-y-0.5 hover:border-app-card-foreground/25"
                      >
                        <div className="relative">
                          <CardPreviewVisual
                            previewUrl={card.previewUrl}
                            previewPosition={card.previewPosition}
                            icon={card.icon}
                            imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                          />
                          {card.isArchived ? (
                            <span className="absolute right-3 top-3 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-sm">
                              {t("status.archived")}
                            </span>
                          ) : null}
                        </div>
                        <div className="px-4 pb-4 pt-4">
                          <div className="truncate text-base font-bold leading-tight tracking-normal text-[#454545]">{card.name}</div>
                          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-app-card-muted">{card.description}</p>
                        </div>
                        <div className="flex items-center gap-2 border-t border-[#EEECE5] bg-app-card-surface px-3 py-2 text-xs text-app-card-muted">
                          <span className="truncate font-normal text-app-card-muted">{card.sourceDomain || card.url}</span>
                          <ExternalLink size={14} className="shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
                    {t("pages.tags.noCards")}
                  </div>
                )}
              </section>

              <aside className="space-y-5 rounded-[18px] border border-border bg-background/70 p-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.tags.rename")}</div>
                  <div className="flex gap-2">
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none transition focus:border-ring"
                      placeholder={t("pages.tags.newTagName")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && renameDirty) void saveRename();
                      }}
                    />
                    <button
                      className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!renameDirty || saving}
                      onClick={() => void saveRename()}
                    >
                      <Pencil size={15} />
                      {t("common.save")}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("pages.tags.renameHint")}</p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.tags.deleteSection")}</div>
                  {!deleteConfirm ? (
                    <button
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                      disabled={saving}
                      onClick={() => setDeleteConfirm(true)}
                    >
                      <Trash2 size={16} />
                      {t("pages.tags.removeFromAll")}
                    </button>
                  ) : (
                    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700">
                        {t("pages.tags.deleteConfirm", { count: selected.count, name: selected.name })}
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="h-9 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
                          disabled={saving}
                          onClick={() => void removeTag()}
                        >
                          {t("common.confirmDelete")}
                        </button>
                        <button
                          className="h-9 flex-1 rounded-lg border border-border bg-white text-sm font-semibold transition hover:bg-muted"
                          onClick={() => setDeleteConfirm(false)}
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !tags.length ? (
        <div className="rounded-[24px] border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          {t("pages.tags.empty")}
        </div>
      ) : null}
      {addDialogOpen ? (
        <NameCreateDialog
          title={t("pages.tags.addDialogTitle")}
          inputLabel={t("pages.tags.newTagName")}
          placeholder={t("pages.tags.namePlaceholder")}
          submitLabel={t("pages.tags.addTag")}
          saving={saving}
          onClose={() => setAddDialogOpen(false)}
          onSubmit={addTag}
        />
      ) : null}
    </div>
  );
}

export function TagsClient() {
  return (
    <div className="page-shell">
      <TagManagerPanel showTitle />
    </div>
  );
}
