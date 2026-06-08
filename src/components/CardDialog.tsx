"use client";

import { ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { iconOptions } from "@/components/icons";
import { SelectMenu } from "@/components/SelectMenu";
import { cardTypeLabels, cardTypes, type Card, type CardInput, type CardType } from "@/lib/types";

type CardDialogProps = {
  card?: Card | null;
  onClose: () => void;
  onSubmit: (input: CardInput) => Promise<void>;
};

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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片读取失败。"));
    };
    image.src = objectUrl;
  });
}

async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件。");
  }

  const image = await loadImage(file);
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
  if (!context) throw new Error("无法处理图片。");

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

export function CardDialog({ card, onClose, onSubmit }: CardDialogProps) {
  const [input, setInput] = useState<CardInput>(() => toInput(card));
  const [tagsText, setTagsText] = useState(() => toInput(card).tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [error, setError] = useState("");
  const title = card ? "编辑卡片" : "新增卡片";

  useEffect(() => {
    const nextInput = toInput(card);
    setInput(nextInput);
    setTagsText(nextInput.tags.join(", "));
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
      setError(err instanceof Error ? err.message : "保存失败。");
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
      if (!response.ok) throw new Error(payload.error || "抓取元数据失败。");

      setInput((current) => ({
        ...current,
        name: current.name || payload.metadata.title || "",
        description: current.description || payload.metadata.description || "",
        previewUrl: current.previewUrl || payload.metadata.previewUrl || null,
        sourceDomain: current.sourceDomain || payload.metadata.sourceDomain || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "抓取元数据失败。");
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
      const previewUrl = await compressImageFile(file);
      setInput((current) => ({ ...current, previewUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片处理失败。");
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md border border-border bg-surface shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="rounded-md p-2 hover:bg-surface-strong" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">名称</span>
            <input
              required
              value={input.name}
              onChange={(event) => setInput({ ...input, name: event.target.value })}
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm font-medium">类型</span>
            <SelectMenu
              value={input.type}
              onChange={(nextValue) => setInput({ ...input, type: nextValue as CardType })}
              options={cardTypes.map((type) => ({ value: type, label: cardTypeLabels[type] }))}
              ariaLabel="卡片类型"
            />
          </div>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">URL</span>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                required
                value={input.url}
                onChange={(event) => setInput({ ...input, url: event.target.value })}
                placeholder="https://example.com 或 /path"
                className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
              />
              <button
                type="button"
                disabled={fetchingMetadata || !input.url}
                onClick={refreshMetadata}
                className="h-10 rounded-full border border-border bg-surface-strong px-4 text-sm font-medium transition hover:border-foreground/20 disabled:opacity-60"
              >
                {fetchingMetadata ? "抓取中..." : "刷新元数据"}
              </button>
            </div>
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">简介</span>
            <textarea
              value={input.description}
              onChange={(event) => setInput({ ...input, description: event.target.value })}
              rows={3}
              className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm font-medium">图标</span>
            <SelectMenu
              value={input.icon}
              onChange={(nextValue) => setInput({ ...input, icon: nextValue })}
              options={iconOptions.map((icon) => ({ value: icon, label: icon }))}
              ariaLabel="卡片图标"
            />
          </div>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">排序值</span>
            <input
              type="number"
              value={input.sortOrder}
              onChange={(event) => setInput({ ...input, sortOrder: Number(event.target.value) })}
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">标签</span>
            <input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="用英文逗号分隔，例如 AI, 写作, 效率"
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">预览图</span>
              <span className="text-xs text-muted">可填写 URL，或选择本地图片嵌入卡片</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <div className="relative h-28 overflow-hidden rounded-md border border-border bg-surface-strong">
                {input.previewUrl ? (
                  <img src={input.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">暂无预览图</div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  value={input.previewUrl || ""}
                  onChange={(event) => setInput({ ...input, previewUrl: event.target.value || null })}
                  placeholder="留空时会尝试自动抓取"
                  className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
                />
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface-strong px-3 text-sm font-medium transition hover:border-foreground/20">
                    <ImagePlus size={16} />
                    选择图片
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {input.previewUrl ? (
                    <button
                      type="button"
                      onClick={() => setInput({ ...input, previewUrl: null })}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium transition hover:border-foreground/20"
                    >
                      <Trash2 size={16} />
                      移除图片
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">来源域名</span>
            <input
              value={input.sourceDomain}
              onChange={(event) => setInput({ ...input, sourceDomain: event.target.value })}
              placeholder="example.com"
              className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">备注</span>
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
            归档卡片
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.isFavorite}
              onChange={(event) => setInput({ ...input, isFavorite: event.target.checked })}
            />
            星标卡片
          </label>
          {error ? <div className="text-sm text-red-600 sm:col-span-2">{error}</div> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-strong" onClick={onClose}>
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
