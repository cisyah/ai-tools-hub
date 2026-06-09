"use client";

import { ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CardPreviewVisual } from "@/components/CardPreviewVisual";
import { iconOptions, CardIcon } from "@/components/icons";
import { pickFirstLoadableImageUrl } from "@/lib/preview-url";
import { SelectMenu } from "@/components/SelectMenu";
import { CardTypeSelect } from "@/components/CardTypeSelect";
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

  context.fillStyle = "#ffffff";
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
    sourceDomain: card.sourceDomain,
    tags: card.tags,
    notes: card.notes,
    isArchived: card.isArchived,
    isFavorite: card.isFavorite,
    sortOrder: card.sortOrder,
  };
}

export function CardDialog({ card, onClose, onSubmit, onDelete }: CardDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [input, setInput] = useState<CardInput>(() => toInput(card));
  const [tagsText, setTagsText] = useState(() => toInput(card).tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [error, setError] = useState("");
  const title = card ? t("cardDialog.editTitle") : t("cardDialog.newTitle");

  useEffect(() => {
    const nextInput = toInput(card);
    setInput(nextInput);
    setTagsText(nextInput.tags.join(", "));
    setDeleteConfirm(false);
  }, [card]);

  const normalizedTags = useMemo(
    () =>
      Array.from(
        new Set(
          tagsText
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      ),
    [tagsText],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit({ ...input, tags: normalizedTags });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? translateApiError(err.message, t) : t("cardDialog.saveFailed"));
    } finally {
      setSaving(false);
    }
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

      const candidates = payload.metadata.previewUrlCandidates?.length
        ? payload.metadata.previewUrlCandidates
        : payload.metadata.previewUrl
          ? [payload.metadata.previewUrl]
          : [];
      const loadablePreviewUrl = await pickFirstLoadableImageUrl(candidates);

      setInput((current) => ({
        ...current,
        name: current.name || payload.metadata.title || "",
        description:
          current.description ||
          payload.metadata.description || "",
        previewUrl:
          loadablePreviewUrl ?? (current.previewUrl?.startsWith("data:") ? current.previewUrl : null),
        sourceDomain: current.sourceDomain || payload.metadata.sourceDomain || "",
      }));
      showToast({ message: t("cardDialog.autofillSuccess") });
    } catch (err) {
      const msg = err instanceof Error ? translateApiError(err.message, t) : t("cardDialog.metadataFailed");
      setError(msg);
      showToast({ message: msg });
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
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm font-medium">{t("cardDialog.type")}</span>
            <CardTypeSelect
              value={input.type}
              onChange={(nextValue) => setInput({ ...input, type: nextValue || "external_link" })}
              ariaLabel={t("cardDialog.typeAria")}
            />
          </div>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">{t("cardDialog.url")}</span>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                required
                value={input.url}
                onChange={(event) => setInput({ ...input, url: event.target.value })}
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
          <label className="space-y-1.5">
            <span className="text-sm font-medium">{t("cardDialog.sortOrder")}</span>
            <input
              type="number"
              value={input.sortOrder}
              onChange={(event) => setInput({ ...input, sortOrder: Number(event.target.value) })}
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">{t("cardDialog.tags")}</span>
            <input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder={t("cardDialog.tagsPlaceholder")}
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{t("cardDialog.preview")}</span>
              <span className="text-xs text-muted">{t("cardDialog.previewHint")}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <CardPreviewVisual
                previewUrl={input.previewUrl ?? null}
                icon={input.icon}
                className="relative h-28 overflow-hidden rounded-md border border-border bg-surface-strong"
                imageClassName="h-full w-full object-cover object-top"
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.isArchived}
              onChange={(event) => setInput({ ...input, isArchived: event.target.checked })}
            />
            {t("cardDialog.archive")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.isFavorite}
              onChange={(event) => setInput({ ...input, isFavorite: event.target.checked })}
            />
            {t("cardDialog.favourite")}
          </label>
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
              className={`${actionButtonMd} bg-accent font-semibold text-accent-foreground disabled:opacity-60`}
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
