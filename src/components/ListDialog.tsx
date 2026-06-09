"use client";

import { Folder, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { SelectMenu } from "@/components/SelectMenu";
import { useListKindLabels } from "@/lib/i18n/hooks";
import { composeListDisplayName, listEmojiOptions, splitListDisplayName } from "@/lib/list-display";
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
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const listTitle = splitListDisplayName(input.name);

  useEffect(() => {
    const nextInput = toInput(list);
    setInput(nextInput);
    setTagsText(nextInput.filters.tags.join(", "));
    setEmojiPickerOpen(false);
  }, [list]);

  useEffect(() => {
    if (!emojiPickerOpen) return;

    function closeEmojiPicker(event: MouseEvent) {
      if (emojiPickerRef.current?.contains(event.target as Node)) return;
      setEmojiPickerOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setEmojiPickerOpen(false);
    }

    document.addEventListener("mousedown", closeEmojiPicker);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeEmojiPicker);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [emojiPickerOpen]);

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
        name: composeListDisplayName(listTitle.emoji, listTitle.title),
        filters: input.kind === "smart" ? { ...input.filters, type: "", tags } : defaultListFilters,
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
            <div ref={emojiPickerRef} className="relative">
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-md border text-lg transition ${
                  emojiPickerOpen ? "border-primary bg-accent-soft" : "border-border bg-surface-strong text-muted-foreground hover:bg-surface"
                }`}
                onClick={() => setEmojiPickerOpen((open) => !open)}
                aria-label={t("listDialog.emoji")}
                aria-expanded={emojiPickerOpen}
              >
                {listTitle.emoji || <Folder size={22} />}
              </button>
              {emojiPickerOpen ? (
                <div className="absolute left-0 top-12 z-50 w-[276px] rounded-lg border border-border bg-surface p-2 shadow-airbnb">
                  <div className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto pr-1">
                    {listEmojiOptions.map((emoji) => {
                      const active = listTitle.emoji === emoji;

                      return (
                        <button
                          key={emoji}
                          type="button"
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-lg transition ${
                            active ? "bg-accent-soft ring-1 ring-primary" : "hover:bg-surface-strong"
                          }`}
                          onClick={() => {
                            setInput({ ...input, name: composeListDisplayName(active ? "" : emoji, listTitle.title) });
                            setEmojiPickerOpen(false);
                          }}
                          aria-pressed={active}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="mt-2 h-8 w-full rounded-md text-sm text-muted-foreground transition hover:bg-surface-strong hover:text-foreground"
                    onClick={() => {
                      setInput({ ...input, name: composeListDisplayName("", listTitle.title) });
                      setEmojiPickerOpen(false);
                    }}
                  >
                    {t("listDialog.noEmoji")}
                  </button>
                </div>
              ) : null}
            </div>
            <input
              required
              value={listTitle.title}
              onChange={(event) => setInput({ ...input, name: composeListDisplayName(listTitle.emoji, event.target.value) })}
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
          <div className="space-y-1.5">
            <span className="text-sm font-semibold">{t("listDialog.listType")}</span>
            <SelectMenu
              value={input.kind}
              onChange={(nextValue) => setInput({ ...input, kind: nextValue as ListKind })}
              options={(["manual", "smart"] as const).map((kind) => ({ value: kind, label: listKindLabels[kind] }))}
              ariaLabel={t("listDialog.typeAria")}
            />
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
            className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground disabled:opacity-60"
          >
            {saving ? t("common.saving") : list ? t("common.save") : t("common.create")}
          </button>
        </div>
      </form>
    </div>
  );
}
