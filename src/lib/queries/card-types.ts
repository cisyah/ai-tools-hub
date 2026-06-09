import type { RowDataPacket } from "mysql2";
import { slugifyCardTypeLabel } from "@/lib/card-types";
import { getPool } from "@/lib/db";
import type { CardTypeDefinition, CardTypeUsage } from "@/lib/types";

type CardTypeRow = RowDataPacket & {
  id: string;
  label: string;
  sort_order: number;
};

type CardTypeCountRow = RowDataPacket & {
  id: string;
  label: string;
  sort_order: number;
  usage_count: number;
};

function mapCardType(row: CardTypeRow): CardTypeDefinition {
  return {
    id: row.id,
    label: row.label,
    sortOrder: row.sort_order,
  };
}

export async function listCardTypes(): Promise<CardTypeDefinition[]> {
  const pool = getPool();
  const [rows] = await pool.query<CardTypeRow[]>(
    "SELECT id, label, sort_order FROM card_types ORDER BY sort_order ASC, label ASC",
  );
  return rows.map(mapCardType);
}

export async function listCardTypeIds(): Promise<string[]> {
  const types = await listCardTypes();
  return types.map((type) => type.id);
}

export async function listCardTypeUsage(includeArchived = true): Promise<CardTypeUsage[]> {
  const pool = getPool();
  const [rows] = await pool.query<CardTypeCountRow[]>(
    `SELECT ct.id, ct.label, ct.sort_order, COUNT(c.id) AS usage_count
     FROM card_types ct
     LEFT JOIN cards c ON c.type = ct.id ${includeArchived ? "" : "AND c.is_archived = FALSE"}
     GROUP BY ct.id, ct.label, ct.sort_order
     ORDER BY ct.sort_order ASC, ct.label ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    sortOrder: row.sort_order,
    count: Number(row.usage_count) || 0,
  }));
}

export async function createCardType(label: string): Promise<CardTypeDefinition> {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) throw new Error("应用类型名称不能为空。");

  const pool = getPool();
  const [existing] = await pool.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM card_types WHERE label = ? LIMIT 1",
    [trimmedLabel],
  );
  if (existing.length) throw new Error("该应用类型名称已存在。");

  let id = slugifyCardTypeLabel(trimmedLabel);
  const [idRows] = await pool.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM card_types WHERE id = ? LIMIT 1",
    [id],
  );
  if (idRows.length) {
    id = `${id}_${Date.now().toString(36)}`.slice(0, 64);
  }

  const [sortRows] = await pool.query<Array<RowDataPacket & { max_sort: number | null }>>(
    "SELECT MAX(sort_order) AS max_sort FROM card_types",
  );
  const sortOrder = Number(sortRows[0]?.max_sort ?? 0) + 10;

  await pool.query("INSERT INTO card_types (id, label, sort_order) VALUES (?, ?, ?)", [id, trimmedLabel, sortOrder]);

  return { id, label: trimmedLabel, sortOrder };
}

export async function renameCardType(id: string, label: string): Promise<void> {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) throw new Error("应用类型名称不能为空。");

  const pool = getPool();
  const [rows] = await pool.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM card_types WHERE id = ? LIMIT 1",
    [id],
  );
  if (!rows.length) throw new Error("应用类型不存在。");

  const [duplicate] = await pool.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM card_types WHERE label = ? AND id <> ? LIMIT 1",
    [trimmedLabel, id],
  );
  if (duplicate.length) throw new Error("该应用类型名称已存在。");

  await pool.query("UPDATE card_types SET label = ? WHERE id = ?", [trimmedLabel, id]);
}

export async function deleteCardType(id: string): Promise<void> {
  const pool = getPool();
  const [usageRows] = await pool.query<Array<RowDataPacket & { count: number }>>(
    "SELECT COUNT(*) AS count FROM cards WHERE type = ?",
    [id],
  );
  const usageCount = Number(usageRows[0]?.count ?? 0);
  if (usageCount > 0) {
    throw new Error(`该应用类型仍被 ${usageCount} 张卡片使用，无法删除。`);
  }

  const [typeRows] = await pool.query<Array<RowDataPacket & { count: number }>>(
    "SELECT COUNT(*) AS count FROM card_types",
  );
  if (Number(typeRows[0]?.count ?? 0) <= 1) {
    throw new Error("至少保留一个应用类型。");
  }

  const [result] = await pool.query<import("mysql2").ResultSetHeader>(
    "DELETE FROM card_types WHERE id = ?",
    [id],
  );
  if (!result.affectedRows) throw new Error("应用类型不存在。");
}

export async function assertKnownCardType(type: string): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM card_types WHERE id = ? LIMIT 1",
    [type],
  );
  if (!rows.length) throw new Error("应用类型不正确。");
}
