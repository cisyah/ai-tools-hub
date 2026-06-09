"use client";

import { ArrowRight, ExternalLink, Info, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CardTypesManager } from "@/components/CardTypesManager";
import { PageTitle } from "@/components/PageTitle";
import { useTranslation } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastProvider";
import { parseApiError, translateApiError, translateEnglish } from "@/lib/i18n";
import type { TagCount } from "@/lib/types";

export function TagsClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "types" ? "types" : "tags";
  const [tags, setTags] = useState<TagCount[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [newTagName, setNewTagName] = useState("");
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

  useEffect(() => {
    refreshTags()
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

  async function addTag() {
    const name = newTagName.trim();
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
      setError(await parseApiError(response, t));
      return;
    }

    await refreshTags();
    setNewTagName("");
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

    await refreshTags();
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

    await refreshTags();
    setSelectedTag("");
    showToast({ message: t("toast.tagRemoved", { name: selected.name }) });
  }

  const renameDirty = selected ? renameValue.trim() !== selected.name : false;

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow={translateEnglish("pages.tags.eyebrow")}
        title={t("nav.tags")}
        description={t("pages.tags.pageDescription")}
      />

      <div className="flex gap-2">
        <Link
          href="/tags"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === "tags" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
          }`}
        >
          {t("pages.tags.tabTags")}
        </Link>
        <Link
          href="/tags?tab=types"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === "types" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
          }`}
        >
          {t("pages.tags.tabTypes")}
        </Link>
      </div>

      {activeTab === "types" ? <CardTypesManager /> : null}

      {activeTab === "tags" ? (
      <>
      <div className="flex gap-3 rounded-[18px] border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
        <Info size={18} className="mt-0.5 shrink-0 text-accent" />
        <div className="space-y-1">
          <p>
            <span className="mr-1.5 font-semibold text-foreground">{t("pages.tags.howToAddTitle")}</span>
            {t("pages.tags.howToAddBody")}
          </p>
          <p>
            <span className="mr-1.5 font-semibold text-foreground">{t("pages.tags.whatCanDoTitle")}</span>
            {t("pages.tags.whatCanDoBody")}
          </p>
        </div>
      </div>

      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{translateApiError(error, t)}</div> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder={t("pages.tags.newPlaceholder")}
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-ring"
          onKeyDown={(event) => {
            if (event.key === "Enter") void addTag();
          }}
        />
        <button
          type="button"
          disabled={saving || !newTagName.trim()}
          onClick={() => void addTag()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          <Plus size={16} />
          {t("pages.tags.addTag")}
        </button>
      </div>

      {tags.length ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-ring"
                placeholder={t("pages.tags.searchPlaceholder")}
              />
            </label>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("pages.tags.showing", { filtered: filteredTags.length, total: tags.length })}</span>
              <span>{t("pages.tags.sortedBy")}</span>
            </div>
            <div className="overflow-x-auto rounded-[18px] border border-border bg-surface">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/70 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-4 py-3">{t("pages.tags.tagColumn")}</th>
                    <th className="px-4 py-3 text-right">{t("pages.tags.countColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag) => {
                    const active = selectedTag === tag.name;
                    return (
                      <tr
                        key={tag.name}
                        className={`cursor-pointer border-b border-border transition last:border-b-0 hover:bg-background ${active ? "bg-accent-soft/50" : ""}`}
                        onClick={() => setSelectedTag(tag.name)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-surface-strong text-foreground"}`}
                            >
                              {tag.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-muted-foreground">{tag.count}</td>
                      </tr>
                    );
                  })}
                  {!filteredTags.length ? (
                    <tr>
                      <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={2}>
                        {t("pages.tags.noMatch")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-[22px] border border-border bg-surface p-5">
            {selected ? (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.tags.selected")}</div>
                  <div className="mt-2 break-words text-2xl font-bold">{selected.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t("pages.tags.cardsUsing", { count: selected.count })}</div>
                </div>

                <Link
                  href={`/?tag=${encodeURIComponent(selected.name)}`}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold transition hover:bg-muted"
                >
                  <ExternalLink size={16} />
                  {t("pages.tags.viewCards")}
                  <ArrowRight size={14} className="text-muted-foreground" />
                </Link>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.tags.rename")}</div>
                  <div className="flex gap-2">
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-ring"
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
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <TagsPlaceholder />
                <p className="font-medium text-foreground">{t("pages.tags.selectHint")}</p>
                <p className="max-w-[220px] text-xs leading-5">{t("pages.tags.selectDesc")}</p>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {!loading && !tags.length ? (
        <div className="rounded-[24px] border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          {t("pages.tags.empty")}
        </div>
      ) : null}
      </>
      ) : null}
    </div>
  );
}

function TagsPlaceholder() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="text-muted-foreground/40">
      <rect x="4" y="10" width="32" height="8" rx="4" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="22" width="20" height="8" rx="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
