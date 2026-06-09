import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { cardMatchesFilters, listCards, listCardsByFilters } from "@/lib/queries/cards";
import { parseListFilters } from "@/lib/validation";
import { defaultListFilters, type Card, type ListInput, type ListKind, type SavedList } from "@/lib/types";

type ListRow = RowDataPacket & {
  id: string;
  name: string;
  description: string;
  kind: ListKind;
  filters: string | null;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
};

type CardListRow = RowDataPacket & {
  card_id: string;
};
type MinSortRow = RowDataPacket & { min_sort: number | null };

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toList(row: ListRow): SavedList {
  let parsedFilters = defaultListFilters;

  try {
    parsedFilters = parseListFilters(row.filters ? JSON.parse(row.filters) : null);
  } catch {
    parsedFilters = defaultListFilters;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    kind: row.kind,
    filters: parsedFilters,
    sortOrder: row.sort_order,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listLists(): Promise<SavedList[]> {
  const pool = getPool();
  const [rows] = await pool.query<ListRow[]>("SELECT * FROM lists ORDER BY sort_order ASC, created_at ASC");
  return rows.map(toList);
}

export async function getList(id: string): Promise<SavedList | null> {
  const pool = getPool();
  const [rows] = await pool.query<ListRow[]>("SELECT * FROM lists WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? toList(rows[0]) : null;
}

export async function createList(input: ListInput, id = crypto.randomUUID()): Promise<SavedList> {
  const pool = getPool();
  const [sortRows] = await pool.query<MinSortRow[]>("SELECT MIN(sort_order) AS min_sort FROM lists");
  const sortOrder = sortRows[0]?.min_sort == null ? 0 : Number(sortRows[0].min_sort) - 10;

  await pool.execute(
    `INSERT INTO lists (id, name, description, kind, filters, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.description, input.kind, JSON.stringify(input.filters), sortOrder],
  );

  const list = await getList(id);
  if (!list) throw new Error("新建列表失败。");
  return list;
}

export async function reorderLists(listIds: string[]): Promise<SavedList[]> {
  const uniqueIds = Array.from(new Set(listIds.map((id) => id.trim()).filter(Boolean)));
  if (!uniqueIds.length) return listLists();

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    for (const [index, id] of uniqueIds.entries()) {
      await connection.execute("UPDATE lists SET sort_order = ? WHERE id = ?", [(index + 1) * 10, id]);
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return listLists();
}

export async function updateList(id: string, input: ListInput): Promise<SavedList> {
  const pool = getPool();

  await pool.execute(
    `UPDATE lists
      SET name = ?, description = ?, kind = ?, filters = ?, sort_order = ?
      WHERE id = ?`,
    [input.name, input.description, input.kind, JSON.stringify(input.filters), input.sortOrder, id],
  );

  const list = await getList(id);
  if (!list) throw new Error("列表不存在。");
  return list;
}

export async function deleteList(id: string): Promise<void> {
  const pool = getPool();
  await pool.execute("DELETE FROM lists WHERE id = ?", [id]);
}

export async function deleteListWithCards(id: string): Promise<{ deletedCards: number }> {
  const list = await getList(id);
  if (!list) throw new Error("列表不存在。");

  const cards = await getCardsForList(list);
  const cardIds = Array.from(new Set(cards.map((card) => card.id)));
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const cardId of cardIds) {
      await connection.execute("DELETE FROM cards WHERE id = ?", [cardId]);
    }

    await connection.execute("DELETE FROM lists WHERE id = ?", [id]);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return { deletedCards: cardIds.length };
}

export async function mergeListIntoList(sourceListId: string, targetListId: string): Promise<{ mergedCount: number }> {
  if (sourceListId === targetListId) throw new Error("不能合并到同一个列表。");

  const sourceList = await getList(sourceListId);
  const targetList = await getList(targetListId);
  if (!sourceList || !targetList) throw new Error("列表不存在。");
  if (targetList.kind !== "manual") throw new Error("只能合并到手动列表。");

  const pool = getPool();
  const sourceCards = await getCardsForList(sourceList);
  const [[lastRow]] = await pool.query<Array<RowDataPacket & { max_sort: number | null }>>(
    "SELECT MAX(sort_order) AS max_sort FROM card_lists WHERE list_id = ?",
    [targetListId],
  );
  let nextSort = lastRow?.max_sort || 0;

  for (const card of sourceCards) {
    nextSort += 10;
    await pool.execute(
      `INSERT INTO card_lists (list_id, card_id, sort_order)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE sort_order = sort_order`,
      [targetListId, card.id, nextSort],
    );
  }

  await deleteList(sourceListId);
  return { mergedCount: sourceCards.length };
}

export async function addCardToList(listId: string, cardId: string): Promise<void> {
  const pool = getPool();
  const [[lastRow]] = await pool.query<Array<RowDataPacket & { max_sort: number | null }>>(
    "SELECT MAX(sort_order) AS max_sort FROM card_lists WHERE list_id = ?",
    [listId],
  );

  await pool.execute(
    `INSERT INTO card_lists (list_id, card_id, sort_order)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE sort_order = sort_order`,
    [listId, cardId, (lastRow?.max_sort || 0) + 10],
  );
}

export async function removeCardFromList(listId: string, cardId: string): Promise<void> {
  const pool = getPool();
  await pool.execute("DELETE FROM card_lists WHERE list_id = ? AND card_id = ?", [listId, cardId]);
}

export async function getCardsForList(list: SavedList): Promise<Card[]> {
  if (list.kind === "smart") {
    return listCardsByFilters(list.filters);
  }

  const pool = getPool();
  const [rows] = await pool.query<CardListRow[]>(
    `SELECT card_id
      FROM card_lists
      WHERE list_id = ?
      ORDER BY sort_order ASC, created_at ASC`,
    [list.id],
  );

  const allCards = await listCards(true);
  const cardsById = new Map(allCards.map((card) => [card.id, card]));
  return rows.map((row) => cardsById.get(row.card_id)).filter((card): card is Card => Boolean(card));
}

export async function getMatchingCardsForSmartList(listId: string): Promise<Card[]> {
  const list = await getList(listId);
  if (!list || list.kind !== "smart") return [];
  const cards = await listCards(true);
  return cards.filter((card) => cardMatchesFilters(card, list.filters));
}
