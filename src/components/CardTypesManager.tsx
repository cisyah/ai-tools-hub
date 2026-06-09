"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { NameCreateDialog } from "@/components/NameCreateDialog";
import { useToast } from "@/components/ToastProvider";
import { useCardTypes } from "@/lib/hooks/useCardTypes";
import { parseApiError, translateApiError } from "@/lib/i18n";
import type { CardTypeUsage } from "@/lib/types";

export function CardTypesManager() {
  const { t } = useTranslation();
  const { getLabel } = useCardTypes();
  const [types, setTypes] = useState<CardTypeUsage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  async function refreshTypes() {
    const response = await fetch("/api/card-types");
    if (!response.ok) throw new Error(await parseApiError(response, t));
    const payload = await response.json();
    setTypes(payload.types || []);
  }

  useEffect(() => {
    refreshTypes()
      .catch(() => setError(t("pages.cardTypes.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    const selected = types.find((type) => type.id === selectedId);
    setRenameValue(selected ? getLabel(selected.id) || selected.label : "");
    setDeleteConfirm(false);
  }, [getLabel, selectedId, types]);

  const filteredTypes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return types;
    return types.filter((type) => {
      const label = getLabel(type.id) || type.label;
      return label.toLowerCase().includes(query) || type.id.toLowerCase().includes(query);
    });
  }, [getLabel, searchQuery, types]);

  const selected = useMemo(
    () => (selectedId ? types.find((type) => type.id === selectedId) : undefined),
    [selectedId, types],
  );

  function displayLabel(type: CardTypeUsage) {
    return getLabel(type.id) || type.label;
  }

  async function addType(inputLabel: string) {
    const label = inputLabel.trim();
    if (!label) {
      setError(t("errors.typeNameRequired"));
      return;
    }

    setSaving(true);
    setError("");

    const response = await fetch("/api/card-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });

    setSaving(false);

    if (!response.ok) {
      const message = await parseApiError(response, t);
      setError(message);
      throw new Error(message);
    }

    const payload = await response.json();
    await refreshTypes();
    setSelectedId(payload.type?.id || "");
    showToast({ message: t("pages.cardTypes.added", { name: label }) });
  }

  async function saveRename() {
    if (!selected) return;
    const label = renameValue.trim();
    if (!label) {
      setError(t("errors.typeNameRequired"));
      return;
    }
    if (label === displayLabel(selected)) return;

    setSaving(true);
    setError("");

    const response = await fetch("/api/card-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, label }),
    });

    setSaving(false);

    if (!response.ok) {
      setError(await parseApiError(response, t));
      return;
    }

    const oldName = displayLabel(selected);
    await refreshTypes();
    showToast({ message: t("pages.cardTypes.renamed", { oldName, newName: label }) });
  }

  async function removeType() {
    if (!selected) return;

    setSaving(true);
    setError("");

    const response = await fetch(`/api/card-types?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" });

    setSaving(false);

    if (!response.ok) {
      setError(await parseApiError(response, t));
      return;
    }

    const name = displayLabel(selected);
    await refreshTypes();
    setSelectedId("");
    showToast({ message: t("pages.cardTypes.removed", { name }) });
  }

  const renameDirty = selected ? renameValue.trim() !== displayLabel(selected) : false;

  return (
    <div className="space-y-5">
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{translateApiError(error, t)}</div> : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAddDialogOpen(true)}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground"
        >
          <Plus size={17} aria-hidden="true" />
          {t("pages.cardTypes.addType")}
        </button>
      </div>

      {types.length ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-ring"
                placeholder={t("pages.cardTypes.searchPlaceholder")}
              />
            </label>
            <div className="overflow-x-auto rounded-[18px] border border-border bg-surface">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/70 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-4 py-3">{t("pages.cardTypes.typeColumn")}</th>
                    <th className="px-4 py-3 text-right">{t("pages.cardTypes.countColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.map((type) => {
                    const active = selectedId === type.id;
                    return (
                      <tr
                        key={type.id}
                        className={`cursor-pointer border-b border-border transition last:border-b-0 hover:bg-background ${active ? "bg-accent-soft/50" : ""}`}
                        onClick={() => setSelectedId(type.id)}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${active ? "bg-accent-soft text-foreground" : "bg-background/70 text-foreground"}`}
                          >
                            {displayLabel(type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-muted-foreground">{type.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-[22px] border border-border bg-surface p-5">
            {selected ? (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.cardTypes.selected")}</div>
                  <div className="mt-2 break-words text-2xl font-bold">{displayLabel(selected)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">ID: {selected.id}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t("pages.cardTypes.cardsUsing", { count: selected.count })}</div>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.cardTypes.rename")}</div>
                  <div className="flex gap-2">
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-ring"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && renameDirty) void saveRename();
                      }}
                    />
                    <button
                      className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-40"
                      disabled={!renameDirty || saving}
                      onClick={() => void saveRename()}
                    >
                      <Pencil size={15} />
                      {t("common.save")}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("pages.cardTypes.deleteSection")}</div>
                  {!deleteConfirm ? (
                    <button
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                      disabled={saving || selected.count > 0}
                      onClick={() => setDeleteConfirm(true)}
                    >
                      <Trash2 size={16} />
                      {t("pages.cardTypes.removeType")}
                    </button>
                  ) : (
                    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700">{t("pages.cardTypes.deleteConfirm", { name: displayLabel(selected) })}</p>
                      <div className="flex gap-2">
                        <button
                          className="h-9 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white"
                          disabled={saving}
                          onClick={() => void removeType()}
                        >
                          {t("common.confirmDelete")}
                        </button>
                        <button
                          className="h-9 flex-1 rounded-lg border border-border bg-white text-sm font-semibold"
                          onClick={() => setDeleteConfirm(false)}
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                  {selected.count > 0 ? <p className="text-xs text-muted-foreground">{t("pages.cardTypes.inUseHint")}</p> : null}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t("pages.cardTypes.selectHint")}</p>
                <p className="max-w-[220px] text-xs leading-5">{t("pages.cardTypes.selectDesc")}</p>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {!loading && !types.length ? (
        <div className="rounded-[24px] border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          {t("pages.cardTypes.empty")}
        </div>
      ) : null}
      {addDialogOpen ? (
        <NameCreateDialog
          title={t("pages.cardTypes.addDialogTitle")}
          inputLabel={t("pages.cardTypes.newTypeName")}
          placeholder={t("pages.cardTypes.namePlaceholder")}
          submitLabel={t("pages.cardTypes.addType")}
          saving={saving}
          onClose={() => setAddDialogOpen(false)}
          onSubmit={addType}
        />
      ) : null}
    </div>
  );
}
