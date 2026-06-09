"use client";

import { Archive, ImagePlus, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CardPreviewVisual } from "@/components/CardPreviewVisual";
import { iconOptions, CardIcon } from "@/components/icons";
import { pickFirstLoadableImageUrl } from "@/lib/preview-url";
import { cleanTitle } from "@/lib/title-cleaner";
import { extractUrl } from "@/lib/url-extractor";
import { SelectMenu } from "@/components/SelectMenu";
import { useTranslation } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastProvider";
import { translateApiError } from "@/lib/i18n";
import type { Card, CardInput } from "@/lib/types";

type CardDialogProps = {
  card?: Card | null;
  onClose: () => void;
  onSubmit: (input: CardInput) => Promise<void>;
  onDelete?: (card: Card) => Promise<void>;
};

const actionButtonClass = "rounded-md px-4 text-sm font-medium transition";
const actionButtonMd = `h-10 ${actionButtonClass}`;
const actionButtonSm = `h-9 px-3 ${actionButtonClass}`;

const emptyInput: CardInput = {
  name: "",
  description: "",
  url: "",
  type: "external_link",
  icon: "Link",
  previewUrl: null,
  previewPosition: "50% 0%",
  sourceDomain: "",
  tags: [],
  notes: "",
  isArchived: false,
  isFavorite: false,
  sortOrder: 0,
};

const maxEmbeddedImageWidth = 960;
const maxEmbeddedImageHeight = 720;
const embeddedImageQuality = 0.78;

function loadImage(file: File, readFailedMessage: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(readFailedMessage));
    };
    image.src = objectUrl;
  });
}

async function compressImageFile(file: File, messages: { typeError: string; processFailed: string; readFailed: string }): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(messages.typeError);
  }

  const image = await loadImage(file, messages.readFailed);
  const scale = Math.min(
    1,
    maxEmbeddedImageWidth / image.naturalWidth,
    maxEmbeddedImageHeight / image.naturalHeight,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error(messages.processFailed);

  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", embeddedImageQuality);
}

function toInput(card?: Card | null): CardInput {
  if (!card) return emptyInput;
  return {
    name: card.name,
    description: card.description,
    url: card.url,
    type: card.type,
    icon: card.icon,
    previewUrl: card.previewUrl,
    previewPosition: card.previewPosition,
    sourceDomain: card.sourceDomain,
    tags: card.tags,
    notes: card.notes,
    isArchived: card.isArchived,
    isFavorite: card.isFavorite,
    sortOrder: card.sortOrder,
  };
}

function normalizeTagName(value: string) {
  return value
    .replace(/^#+/, "")
    .replace(/^[,，、;；\s]+|[,，、;；\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map(normalizeTagName).filter(Boolean)));
}

function parseTagDraft(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const chunks = trimmed.includes("#")
    ? trimmed.split("#").flatMap((chunk) => chunk.split(/[,，、;；\n]+/))
    : trimmed.split(/[,，、;；\n]+/);

  return uniqueTags(chunks);
}

export function CardDialog({ card, onClose, onSubmit, onDelete }: CardDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [input, setInput] = useState<CardInput>(() => toInput(card));
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [error, setError] = useState("");
  const title = card ? t("cardDialog.editTitle") : t("cardDialog.newTitle");

  useEffect(() => {
    const nextInput = toInput(card);
    setInput(nextInput);
    setTagDraft("");
    setDeleteConfirm(false);
  }, [card]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const tags = uniqueTags([...input.tags, ...parseTagDraft(tagDraft)]);
      await onSubmit({ ...input, type: "external_link", tags });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? translateApiError(err.message, t) : t("cardDialog.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function addDraftTags() {
    const nextTags = parseTagDraft(tagDraft);
    if (!nextTags.length) return false;

    setInput((current) => ({ ...current, tags: uniqueTags([...current.tags, ...nextTags]) }));
    setTagDraft("");
    return true;
  }

  function removeTag(tag: string) {
    setInput((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
  }

  async function refreshMetadata() {
    if (!input.url) return;

    setFetchingMetadata(true);
    setError("");

    try {
      const response = await fetch("/api/cards/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.url }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("cardDialog.metadataFailed"));

      const meta = payload.metadata || {};
      const candidates = meta.previewUrlCandidates?.length
        ? meta.previewUrlCandidates
        : meta.previewUrl
          ? [meta.previewUrl]
          : [];
      const loadablePreviewUrl = await pickFirstLoadableImageUrl(candidates);

      const authorPrefix = meta.author
        ? `${meta.author} · `
        : "";

      // ── 小红书：完全无法提取，提示手动填写 ──
      if (meta.platform === "xiaohongshu" && !meta.title) {
        setError("⚠️ 小红书暂不支持自动提取，请手动填写标题和上传封面图片");
        setFetchingMetadata(false);
        return;
      }

      const newTitle = meta.title || "";
      const newDesc = (authorPrefix + (meta.description || "")).trim();
      const newPreview = loadablePreviewUrl ?? null;

      setInput((current) => ({
        ...current,
        name: current.name || newTitle,
        description: current.description || newDesc,
        previewUrl: newPreview ?? (current.previewUrl?.startsWith("data:") ? current.previewUrl : null),
        sourceDomain: current.sourceDomain || meta.sourceDomain || "",
      }));

      // ── 检查哪些字段没拿到，给出具体提示 ──
      const missing: string[] = [];
      if (!newTitle) missing.push("标题");
      if (!newPreview) missing.push("封面图");
      if (!newDesc) missing.push("简介");

      if (missing.length === 0) {
        showToast({ message: t("cardDialog.autofillSuccess") });
      } else if (missing.length === 3) {
        setError("⚠️ 未能提取到任何信息，请手动填写标题、简介和上传封面图片");
      } else {
        showToast({ message: `已自动填写，还需手动补充：${missing.join("、")}` });
      }
    } catch (err) {
      const msg = err instanceof Error ? translateApiError(err.message, t) : t("cardDialog.metadataFailed");
      setError(`⚠️ ${msg}，请手动填写标题、简介和上传封面图片`);
    } finally {
      setFetchingMetadata(false);
    }
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");

    try {
      const previewUrl = await compressImageFile(file, {
        typeError: t("cardDialog.imageTypeError"),
        processFailed: t("cardDialog.imageProcessFailed"),
        readFailed: t("cardDialog.imageReadFailed"),
      });
      setInput((current) => ({ ...current, previewUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("cardDialog.imageHandleFailed"));
    }
  }

  async function handleDelete() {
    if (!card || !onDelete) return;

    setDeleting(true);
    setError("");

    try {
      await onDelete(card);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? translateApiError(err.message, t) : t("cardDialog.deleteFailed"));
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  const actionDisabled = saving || deleting;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-surface shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="rounded-md p-2 hover:bg-surface-strong" onClick={onClose} aria-label={t("cardDialog.close")}>
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">{t("cardDialog.name")}</span>
            <input
              required
              value={input.name}
              onChange={(event) => setInput({ ...input, name: event.target.value })}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text/plain");
                const cleaned = cleanTitle(pasted);
                if (cleaned && cleaned !== pasted) {
                  event.preventDefault();
                  setInput({ ...input, name: cleaned });
                  showToast({ message: "已自动清理标题" });
                }
              }}
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">{t("cardDialog.url")}</span>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                required
                value={input.url}
                onChange={(event) => setInput({ ...input, url: event.target.value })}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData("text/plain");
                  const url = extractUrl(pasted);
                  if (url && url !== pasted.trim()) {
                    event.preventDefault();
                    setInput({ ...input, url });
                    showToast({ message: "已自动提取链接" });
                  }
                }}
                placeholder={t("cardDialog.urlPlaceholder")}
                className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
              />
              <button
                type="button"
                disabled={fetchingMetadata || !input.url}
                onClick={refreshMetadata}
                className={`${actionButtonMd} border border-border bg-surface-strong hover:border-foreground/20 disabled:opacity-60`}
              >
                {fetchingMetadata ? t("cardDialog.autofillLoading") : t("cardDialog.autofill")}
              </button>
            </div>
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">{t("cardDialog.description")}</span>
            <textarea
              value={input.description}
              onChange={(event) =>
                setInput({ ...input, description: event.target.value })
              }
              rows={3}
              placeholder={t("cardDialog.descriptionPlaceholder")}
              className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[minmax(180px,0.42fr)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <span className="text-sm font-medium">{t("cardDialog.icon")}</span>
              <SelectMenu
                value={input.icon}
                onChange={(nextValue) => setInput({ ...input, icon: nextValue })}
                options={iconOptions.map((icon) => ({
                  value: icon,
                  label: icon,
                  leading: <CardIcon name={icon} size={16} />,
                }))}
                ariaLabel={t("cardDialog.iconAria")}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <span className="text-sm font-medium">{t("cardDialog.tags")}</span>
              <div className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1.5 transition focus-within:border-ring">
                {input.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-sm font-medium text-foreground"
                  >
                    <span className="min-w-0 truncate">#{tag}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground hover:bg-background/70 hover:text-foreground"
                      onClick={() => removeTag(tag)}
                      aria-label={t("cardDialog.removeTag", { name: tag })}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      addDraftTags();
                    }
                    if (event.key === "Backspace" && !tagDraft && input.tags.length) {
                      setInput((current) => ({ ...current, tags: current.tags.slice(0, -1) }));
                    }
                  }}
                  placeholder={input.tags.length ? t("cardDialog.tagsMorePlaceholder") : t("cardDialog.tagsPlaceholder")}
                  className="h-7 min-w-[180px] flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{t("cardDialog.preview")}</span>
              <span className="text-xs text-muted">{t("cardDialog.previewHint")}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <CardPreviewVisual
                previewUrl={input.previewUrl ?? null}
                previewPosition={input.previewPosition}
                icon={input.icon}
                className="relative h-28 overflow-hidden rounded-md border border-border bg-surface-strong"
                imageClassName="h-full w-full object-cover"
                emptyLabel={t("cardDialog.previewEmpty")}
              />
              <div className="space-y-2">
                <input
                  value={input.previewUrl || ""}
                  onChange={(event) => setInput({ ...input, previewUrl: event.target.value || null })}
                  placeholder={t("cardDialog.previewPlaceholder")}
                  className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
                />
                <div className="flex flex-wrap gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-2 border border-border bg-surface-strong ${actionButtonSm} hover:border-foreground/20`}>
                    <ImagePlus size={16} />
                    {t("cardDialog.chooseImage")}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {input.previewUrl ? (
                    <button
                      type="button"
                      onClick={() => setInput({ ...input, previewUrl: null })}
                      className={`inline-flex items-center gap-2 border border-border ${actionButtonSm} hover:border-foreground/20`}
                    >
                      <Trash2 size={16} />
                      {t("cardDialog.removeImage")}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">{t("cardDialog.sourceDomain")}</span>
            <input
              value={input.sourceDomain}
              onChange={(event) => setInput({ ...input, sourceDomain: event.target.value })}
              placeholder={t("cardDialog.sourceDomainPlaceholder")}
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">{t("cardDialog.notes")}</span>
            <textarea
              value={input.notes}
              onChange={(event) => setInput({ ...input, notes: event.target.value })}
              rows={3}
              className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={input.isArchived}
              onClick={() => setInput({ ...input, isArchived: !input.isArchived })}
              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                input.isArchived
                  ? "border-primary bg-accent-soft text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              <Archive size={16} aria-hidden="true" />
              {t("cardDialog.archive")}
            </button>
            <button
              type="button"
              aria-pressed={input.isFavorite}
              onClick={() => setInput({ ...input, isFavorite: !input.isFavorite })}
              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                input.isFavorite
                  ? "border-primary bg-accent-soft text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              <Star size={16} className={input.isFavorite ? "fill-accent text-accent" : ""} aria-hidden="true" />
              {t("cardDialog.favourite")}
            </button>
          </div>
          {error ? <div className="text-sm text-red-600 sm:col-span-2">{error}</div> : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div className="min-w-0">
            {card && onDelete ? (
              deleteConfirm ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-red-600">{t("cardDialog.deleteConfirm", { name: card.name })}</span>
                  <button
                    type="button"
                    disabled={actionDisabled}
                    onClick={() => void handleDelete()}
                    className={`${actionButtonMd} border border-red-200 bg-red-600 font-semibold text-white hover:bg-red-700 disabled:opacity-60`}
                  >
                    {deleting ? t("common.deleting") : t("common.confirmDelete")}
                  </button>
                  <button
                    type="button"
                    disabled={actionDisabled}
                    onClick={() => setDeleteConfirm(false)}
                    className={`${actionButtonMd} border border-border hover:bg-surface-strong disabled:opacity-60`}
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={actionDisabled}
                  onClick={() => setDeleteConfirm(true)}
                  className={`inline-flex items-center gap-2 ${actionButtonMd} border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60`}
                >
                  <Trash2 size={16} />
                  {t("common.delete")}
                </button>
              )
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={actionDisabled}
              className={`${actionButtonMd} border border-border hover:bg-surface-strong disabled:opacity-60`}
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={actionDisabled}
              className={`${actionButtonMd} bg-primary font-semibold text-primary-foreground hover:bg-primary-hover hover:text-primary-hover-foreground disabled:opacity-60`}
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
