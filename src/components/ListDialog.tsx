"use client";

import { Folder, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CardTypeSelect } from "@/components/CardTypeSelect";
import { useTranslation } from "@/components/LocaleProvider";
import { SelectMenu } from "@/components/SelectMenu";
import { useListKindLabels } from "@/lib/i18n/hooks";
import { defaultListFilters, type ListInput, type ListKind, type SavedList } from "@/lib/types";

type ListDialogProps = {
  list?: SavedList | null;
  onClose: () => void;
  onSubmit: (input: ListInput) => Promise<void>;
};

const emptyInput: ListInput = {
  name: "",
  description: "",
  kind: "manual",
  filters: defaultListFilters,
  sortOrder: 0,
};

function toInput(list?: SavedList | null): ListInput {
  if (!list) return emptyInput;
  return {
    name: list.name,
    description: list.description,
    kind: list.kind,
    filters: list.filters,
    sortOrder: list.sortOrder,
  };
}

export function ListDialog({ list, onClose, onSubmit }: ListDialogProps) {
  const { t } = useTranslation();
  const listKindLabels = useListKindLabels();
  const [input, setInput] = useState<ListInput>(() => toInput(list));
  const [tagsText, setTagsText] = useState(() => toInput(list).filters.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextInput = toInput(list);
    setInput(nextInput);
    setTagsText(nextInput.filters.tags.join(", "));
  }, [list]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const tags = Array.from(
        new Set(
          tagsText
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      );
      await onSubmit({
        ...input,
        filters: input.kind === "smart" ? { ...input.filters, tags } : defaultListFilters,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("listDialog.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between bg-surface px-6 pb-2 pt-6">
          <h2 className="text-lg font-semibold">{list ? t("listDialog.editTitle") : t("listDialog.newTitle")}</h2>
          <button type="button" className="rounded-md p-2 hover:bg-surface-strong" onClick={onClose} aria-label={t("listDialog.close")}>
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-5 px-6 py-4">
          <div className="grid gap-2 sm:grid-cols-[44px_1fr]">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-strong text-muted-foreground">
              <Folder size={22} />
            </div>
            <input
              required
              value={input.name}
              onChange={(event) => setInput({ ...input, name: event.target.value })}
              placeholder={t("listDialog.namePlaceholder")}
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <label className="space-y-1.5">
            <span className="text-sm font-semibold">{t("listDialog.descriptionOptional")}</span>
            <textarea
              value={input.description}
              onChange={(event) => setInput({ ...input, description: event.target.value })}
              rows={2}
              placeholder={t("listDialog.descriptionPlaceholder")}
              className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-sm font-semibold">{t("listDialog.listType")}</span>
              <SelectMenu
                value={input.kind}
                onChange={(nextValue) => setInput({ ...input, kind: nextValue as ListKind })}
                options={(["manual", "smart"] as const).map((kind) => ({ value: kind, label: listKindLabels[kind] }))}
                ariaLabel={t("listDialog.typeAria")}
              />
            </div>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold">{t("listDialog.sortOrder")}</span>
              <input
                type="number"
                value={input.sortOrder}
                onChange={(event) => setInput({ ...input, sortOrder: Number(event.target.value) })}
                className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
              />
            </label>
          </div>
          {input.kind === "smart" ? (
            <div className="grid gap-3 rounded-md border border-border bg-surface-strong p-3 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium">{t("listDialog.searchQuery")}</span>
                <input
                  value={input.filters.searchQuery}
                  onChange={(event) => setInput({ ...input, filters: { ...input.filters, searchQuery: event.target.value } })}
                  className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
                />
              </label>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">{t("listDialog.type")}</span>
                <CardTypeSelect
                  value={input.filters.type}
                  onChange={(nextValue) => setInput({ ...input, filters: { ...input.filters, type: nextValue } })}
                  includeAllOption
                  allOptionLabel={t("filter.allTypes")}
                  ariaLabel={t("filter.typeAria")}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">{t("listDialog.archived")}</span>
                <SelectMenu
                  value={input.filters.archived}
                  onChange={(nextValue) =>
                    setInput({ ...input, filters: { ...input.filters, archived: nextValue as "active" | "archived" | "all" } })
                  }
                  options={[
                    { value: "active", label: t("archivedFilter.active") },
                    { value: "archived", label: t("archivedFilter.archived") },
                    { value: "all", label: t("archivedFilter.all") },
                  ]}
                  ariaLabel={t("listDialog.archived")}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">{t("listDialog.favourite")}</span>
                <SelectMenu
                  value={input.filters.favorite}
                  onChange={(nextValue) =>
                    setInput({ ...input, filters: { ...input.filters, favorite: nextValue as "" | "favorite" | "normal" } })
                  }
                  options={[
                    { value: "", label: t("filter.all") },
                    { value: "favorite", label: t("filter.favourite") },
                    { value: "normal", label: t("filter.normal") },
                  ]}
                  ariaLabel={t("listDialog.favourite")}
                />
              </div>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">{t("listDialog.tagsAnd")}</span>
                <input
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                  placeholder={t("listDialog.tagsPlaceholder")}
                  className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
                />
              </label>
            </div>
          ) : null}
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
        <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
          <button type="button" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-strong" onClick={onClose}>
            {t("common.close")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
          >
            {saving ? t("common.saving") : list ? t("common.save") : t("common.create")}
          </button>
        </div>
      </form>
    </div>
  );
}
