import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getPlatformSource } from "@/lib/platform-source";
import { resolveCardMetadata } from "@/lib/preview";
import type {
  ArchivedFilter,
  Card,
  CardInput,
  CardType,
  FavoriteFilter,
  ListFilters,
  OpenEventInput,
  StatsSummary,
  TagCount,
} from "@/lib/types";

type CardRow = RowDataPacket & {
  id: string;
  name: string;
  description: string;
  url: string;
  type: CardType;
  icon: string;
  preview_url: string | null;
  preview_position?: string | null;
  source_domain: string;
  tags: string | string[] | null;
  notes: string;
  is_archived: number | boolean;
  is_favorite: number | boolean;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
};

type CountRow = RowDataPacket & { count: number };
type MinSortRow = RowDataPacket & { min_sort: number | null };

function parseTags(value: CardRow["tags"]): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toCard(row: CardRow): Card {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    type: row.type,
    icon: row.icon,
    previewUrl: row.preview_url,
    previewPosition: row.preview_position || "50% 0%",
    sourceDomain: row.source_domain,
    tags: parseTags(row.tags),
    notes: row.notes,
    isArchived: Boolean(row.is_archived),
    isFavorite: Boolean(row.is_favorite),
    sortOrder: row.sort_order,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function getCardRows(includeArchived: boolean): Promise<CardRow[]> {
  const pool = getPool();
  const sql = includeArchived
    ? "SELECT * FROM cards ORDER BY sort_order ASC, created_at ASC"
    : "SELECT * FROM cards WHERE is_archived = FALSE ORDER BY sort_order ASC, created_at ASC";
  const [rows] = await pool.query<CardRow[]>(sql);
  return rows;
}

export async function listCards(includeArchived = false): Promise<Card[]> {
  const rows = await getCardRows(includeArchived);
  return rows.map(toCard);
}

export function cardMatchesFilters(card: Card, filters: ListFilters): boolean {
  if (filters.archived === "active" && card.isArchived) return false;
  if (filters.archived === "archived" && !card.isArchived) return false;
  if (filters.favorite === "favorite" && !card.isFavorite) return false;
  if (filters.favorite === "normal" && card.isFavorite) return false;

  const query = filters.searchQuery.trim().toLowerCase();
  if (query) {
    const haystack = [
      card.name,
      card.description,
      card.url,
      card.notes,
      card.sourceDomain,
      ...card.tags,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  return filters.tags.every((tag) => card.tags.includes(tag));
}

export async function listCardsByFilters(filters: ListFilters): Promise<Card[]> {
  const cards = await listCards(filters.archived !== "active");
  return cards.filter((card) => cardMatchesFilters(card, filters));
}

export async function getCard(id: string): Promise<Card | null> {
  const pool = getPool();
  const [rows] = await pool.query<CardRow[]>("SELECT * FROM cards WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? toCard(rows[0]) : null;
}

export async function createCard(input: CardInput, id = crypto.randomUUID()): Promise<Card> {
  const pool = getPool();
  const metadata = await resolveCardMetadata(input);
  const [sortRows] = await pool.query<MinSortRow[]>("SELECT MIN(sort_order) AS min_sort FROM cards WHERE is_archived = FALSE");
  const sortOrder = sortRows[0]?.min_sort == null ? 0 : Number(sortRows[0].min_sort) - 10;

  await pool.execute(
    `INSERT INTO cards
      (id, name, description, url, type, icon, preview_url, preview_position, source_domain, tags, notes, is_archived, is_favorite, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      metadata.title,
      metadata.description,
      input.url,
      input.type,
      input.icon,
      metadata.previewUrl,
      input.previewPosition,
      metadata.sourceDomain,
      JSON.stringify(input.tags),
      input.notes,
      input.isArchived,
      input.isFavorite,
      sortOrder,
    ],
  );

  const card = await getCard(id);
  if (!card) throw new Error("新建卡片失败。");
  return card;
}

export async function reorderCards(cardIds: string[]): Promise<Card[]> {
  const uniqueIds = Array.from(new Set(cardIds.map((id) => id.trim()).filter(Boolean)));
  if (!uniqueIds.length) return listCards(false);

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    for (const [index, id] of uniqueIds.entries()) {
      await connection.execute("UPDATE cards SET sort_order = ? WHERE id = ? AND is_archived = FALSE", [(index + 1) * 10, id]);
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return listCards(false);
}

export async function updateCard(id: string, input: CardInput): Promise<Card> {
  const pool = getPool();
  const metadata = await resolveCardMetadata(input);

  await pool.execute(
    `UPDATE cards
      SET name = ?, description = ?, url = ?, type = ?, icon = ?, preview_url = ?, preview_position = ?,
        source_domain = ?, tags = ?, notes = ?, is_archived = ?, is_favorite = ?, sort_order = ?
      WHERE id = ?`,
    [
      metadata.title,
      metadata.description,
      input.url,
      input.type,
      input.icon,
      metadata.previewUrl,
      input.previewPosition,
      metadata.sourceDomain,
      JSON.stringify(input.tags),
      input.notes,
      input.isArchived,
      input.isFavorite,
      input.sortOrder,
      id,
    ],
  );

  const card = await getCard(id);
  if (!card) throw new Error("卡片不存在。");
  return card;
}

export async function deleteCard(id: string): Promise<void> {
  const pool = getPool();
  await pool.execute("DELETE FROM cards WHERE id = ?", [id]);
}

export async function setCardArchiveState(id: string, isArchived: boolean): Promise<Card> {
  const pool = getPool();
  await pool.execute("UPDATE cards SET is_archived = ? WHERE id = ?", [isArchived, id]);
  const card = await getCard(id);
  if (!card) throw new Error("卡片不存在。");
  return card;
}

export async function setCardFavoriteState(id: string, isFavorite: boolean): Promise<Card> {
  const pool = getPool();
  await pool.execute("UPDATE cards SET is_favorite = ? WHERE id = ?", [isFavorite, id]);
  const card = await getCard(id);
  if (!card) throw new Error("卡片不存在。");
  return card;
}

export async function recordOpenEvent(input: OpenEventInput): Promise<void> {
  const pool = getPool();
  const id = crypto.randomUUID();

  await pool.execute(
    `INSERT INTO card_open_events
      (id, card_id, card_type, event_day, search_query, filter_type, filter_tags)
      VALUES (?, ?, ?, CURRENT_DATE(), ?, ?, ?)`,
    [
      id,
      input.cardId,
      input.cardType,
      input.searchQuery,
      input.filterType,
      JSON.stringify(input.filterTags),
    ],
  );
}

export async function listTagCounts(includeArchived = false): Promise<TagCount[]> {
  const pool = getPool();
  const counts = new Map<string, number>();

  const [registryRows] = await pool.query<Array<RowDataPacket & { name: string }>>(
    "SELECT name FROM tag_registry",
  );
  for (const row of registryRows) {
    counts.set(row.name, 0);
  }

  const cards = await listCards(includeArchived);
  for (const card of cards) {
    for (const tag of card.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function createTag(name: string): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("标签名称不能为空。");

  const existing = await listTagCounts(true);
  if (existing.some((tag) => tag.name === trimmedName)) {
    throw new Error("该标签已存在。");
  }

  const pool = getPool();
  await pool.execute("INSERT INTO tag_registry (name) VALUES (?)", [trimmedName]);
}

export async function renameTag(oldName: string, newName: string): Promise<void> {
  const trimmedNewName = newName.trim();
  if (!trimmedNewName) throw new Error("标签名称不能为空。");

  const existing = await listTagCounts(true);
  if (existing.some((tag) => tag.name === trimmedNewName && oldName !== trimmedNewName)) {
    throw new Error("该标签已存在。");
  }

  const cards = await listCards(true);
  const pool = getPool();

  for (const card of cards) {
    if (!card.tags.includes(oldName)) continue;

    const tags = Array.from(new Set(card.tags.map((tag) => (tag === oldName ? trimmedNewName : tag))));
    await pool.execute("UPDATE cards SET tags = ? WHERE id = ?", [JSON.stringify(tags), card.id]);
  }

  await pool.execute("UPDATE tag_registry SET name = ? WHERE name = ?", [trimmedNewName, oldName]);
}

export async function deleteTag(name: string): Promise<void> {
  const cards = await listCards(true);
  const pool = getPool();

  for (const card of cards) {
    if (!card.tags.includes(name)) continue;

    const tags = card.tags.filter((tag) => tag !== name);
    await pool.execute("UPDATE cards SET tags = ? WHERE id = ?", [JSON.stringify(tags), card.id]);
  }

  await pool.execute("DELETE FROM tag_registry WHERE name = ?", [name]);
}

export async function getStats(): Promise<StatsSummary> {
  const pool = getPool();
  const cards = await listCards(true);
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const [[totalRow]] = await pool.query<CountRow[]>("SELECT COUNT(*) AS count FROM card_open_events");
  const [[last7Row]] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS count FROM card_open_events WHERE event_day >= CURRENT_DATE() - INTERVAL 6 DAY",
  );
  const [[last30Row]] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS count FROM card_open_events WHERE event_day >= CURRENT_DATE() - INTERVAL 29 DAY",
  );

  const [dailyRows] = await pool.query<Array<RowDataPacket & { event_day: Date | string; count: number }>>(
    `SELECT event_day, COUNT(*) AS count
      FROM card_open_events
      WHERE event_day >= CURRENT_DATE() - INTERVAL 29 DAY
      GROUP BY event_day
      ORDER BY event_day ASC`,
  );

  const [topRows] = await pool.query<Array<RowDataPacket & { card_id: string; count: number }>>(
    `SELECT card_id, COUNT(*) AS count
      FROM card_open_events
      GROUP BY card_id
      ORDER BY count DESC
      LIMIT 5`,
  );

  const [cardEventRows] = await pool.query<Array<RowDataPacket & { card_id: string; count: number }>>(
    `SELECT card_id, COUNT(*) AS count
      FROM card_open_events
      GROUP BY card_id`,
  );

  const sourceDistribution = new Map<string, number>();
  const tagDistribution = new Map<string, number>();
  for (const row of cardEventRows) {
    const card = cardsById.get(row.card_id);
    if (!card) continue;
    const source = getPlatformSource(card.url, card.sourceDomain);
    sourceDistribution.set(source, (sourceDistribution.get(source) || 0) + row.count);
    for (const tag of card.tags) {
      tagDistribution.set(tag, (tagDistribution.get(tag) || 0) + row.count);
    }
  }

  return {
    totalOpens: totalRow?.count || 0,
    last7Days: last7Row?.count || 0,
    last30Days: last30Row?.count || 0,
    daily: dailyRows.map((row) => ({
      eventDay: row.event_day instanceof Date ? row.event_day.toISOString().slice(0, 10) : String(row.event_day),
      count: row.count,
    })),
    topCards: topRows.map((row) => ({
      cardId: row.card_id,
      name: cardsById.get(row.card_id)?.name || "已删除卡片",
      count: row.count,
    })),
    sourceDistribution: Array.from(sourceDistribution.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source)),
    tagDistribution: Array.from(tagDistribution.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}
