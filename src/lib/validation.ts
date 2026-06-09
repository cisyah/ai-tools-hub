import { isCardTypeSlug } from "@/lib/card-types";
import {
  defaultListFilters,
  type ArchivedFilter,
  type CardInput,
  type CardType,
  type FavoriteFilter,
  type ListFilters,
  type ListInput,
  type ListKind,
  type OpenEventInput,
} from "@/lib/types";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of value) {
    const tag = asString(item);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }

  return tags;
}

function asCardType(value: unknown): CardType | null {
  const slug = asString(value);
  return isCardTypeSlug(slug) ? slug : null;
}

function asPreviewPosition(value: unknown): string {
  const text = asString(value);
  const match = text.match(/^(\d{1,3})%\s+(\d{1,3})%$/);
  if (!match) return "50% 0%";

  const x = Math.min(100, Math.max(0, Number(match[1])));
  const y = Math.min(100, Math.max(0, Number(match[2])));
  return `${x}% ${y}%`;
}

function asListKind(value: unknown): ListKind | null {
  return value === "manual" || value === "smart" ? value : null;
}

function asArchivedFilter(value: unknown): ArchivedFilter {
  return value === "archived" || value === "all" ? value : "active";
}

function asFavoriteFilter(value: unknown): FavoriteFilter {
  return value === "favorite" || value === "normal" ? value : "";
}

export function isValidUrl(value: string): boolean {
  if (value.startsWith("/")) return value.length > 1 && !value.startsWith("//");

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isExternalHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseCardInput(body: unknown): CardInput {
  if (!body || typeof body !== "object") {
    throw new Error("请求体格式不正确。");
  }

  const data = body as Record<string, unknown>;
  const name = asString(data.name);
  const description = asString(data.description);
  const url = asString(data.url);
  const type = asCardType(data.type) || "external_link";
  const sortOrder = Number(data.sortOrder ?? data.sort_order ?? 0);

  if (!name) throw new Error("名称不能为空。");
  if (!url || !isValidUrl(url)) throw new Error("URL 只支持 http(s):// 或站内 /path。");
  if (!Number.isFinite(sortOrder)) throw new Error("排序值必须是数字。");

  return {
    name,
    description,
    url,
    type,
    icon: asString(data.icon),
    previewUrl: asString(data.previewUrl ?? data.preview_url) || null,
    previewPosition: asPreviewPosition(data.previewPosition ?? data.preview_position),
    sourceDomain: asString(data.sourceDomain ?? data.source_domain),
    tags: asTags(data.tags),
    notes: asString(data.notes),
    isArchived: asBoolean(data.isArchived ?? data.is_archived),
    isFavorite: asBoolean(data.isFavorite ?? data.is_favorite),
    sortOrder,
  };
}

export function parseOpenEventInput(body: unknown): OpenEventInput {
  if (!body || typeof body !== "object") {
    throw new Error("请求体格式不正确。");
  }

  const data = body as Record<string, unknown>;
  const cardId = asString(data.cardId ?? data.card_id);
  const cardType = asCardType(data.cardType ?? data.card_type);
  const filterTypeValue = asString(data.filterType ?? data.filter_type);
  const filterType = filterTypeValue ? asCardType(filterTypeValue) : "";

  if (!cardId) throw new Error("cardId 不能为空。");
  if (!cardType) throw new Error("cardType 不正确。");
  if (filterTypeValue && !filterType) throw new Error("filterType 不正确。");

  return {
    cardId,
    cardType,
    searchQuery: asString(data.searchQuery ?? data.search_query).slice(0, 255),
    filterType: filterType || "",
    filterTags: asTags(data.filterTags ?? data.filter_tags),
  };
}

export function parseListFilters(value: unknown): ListFilters {
  if (!value || typeof value !== "object") return defaultListFilters;
  const data = value as Record<string, unknown>;
  return {
    searchQuery: asString(data.searchQuery ?? data.search_query),
    type: "",
    tags: asTags(data.tags ?? data.filterTags ?? data.filter_tags),
    archived: asArchivedFilter(data.archived),
    favorite: asFavoriteFilter(data.favorite),
  };
}

export function parseListInput(body: unknown): ListInput {
  if (!body || typeof body !== "object") {
    throw new Error("请求体格式不正确。");
  }

  const data = body as Record<string, unknown>;
  const name = asString(data.name);
  const kind = asListKind(data.kind);
  const sortOrder = Number(data.sortOrder ?? data.sort_order ?? 0);

  if (!name) throw new Error("列表名称不能为空。");
  if (!kind) throw new Error("列表类型不正确。");
  if (!Number.isFinite(sortOrder)) throw new Error("排序值必须是数字。");

  return {
    name,
    description: asString(data.description),
    kind,
    filters: kind === "smart" ? parseListFilters(data.filters) : defaultListFilters,
    sortOrder,
  };
}
