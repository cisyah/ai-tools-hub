"use client";

import Link from "next/link";
import { ListFilter, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ListDialog } from "@/components/ListDialog";
import { PageTitle } from "@/components/PageTitle";
import { listKindLabels, type ListInput, type SavedList } from "@/lib/types";

async function parseApiError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error || "请求失败。";
}

export function ListsClient() {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogList, setDialogList] = useState<SavedList | null | undefined>(undefined);

  async function refreshLists() {
    const response = await fetch("/api/lists");
    if (!response.ok) throw new Error(await parseApiError(response));
    const payload = await response.json();
    setLists(payload.lists || []);
  }

  useEffect(() => {
    refreshLists()
      .catch(() => setError("加载列表失败，请确认数据库已初始化。"))
      .finally(() => setLoading(false));
  }, []);

  async function saveList(input: ListInput) {
    const editing = dialogList && "id" in dialogList;
    const response = await fetch(editing ? `/api/lists/${dialogList.id}` : "/api/lists", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await parseApiError(response));
    await refreshLists();
  }

  async function removeList(list: SavedList) {
    const confirmed = window.confirm(`确认删除列表「${list.name}」？列表内卡片不会被删除。`);
    if (!confirmed) return;

    const response = await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }
    await refreshLists();
  }

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow="Collections"
        title="Lists"
        description="Manual lists hold curated collections. Smart lists save filters and match cards automatically."
        action={
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
          onClick={() => setDialogList(null)}
        >
          <Plus size={17} />
          新增列表
        </button>
        }
      />
      {loading ? <div className="text-sm text-muted-foreground">加载中...</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lists.map((list) => (
          <article key={list.id} className="hover-airbnb-lift rounded-[20px] bg-surface p-5 shadow-airbnb transition duration-200 hover:-translate-y-0.5">
            <Link href={`/lists/${list.id}`} className="block">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <ListFilter size={16} />
                {listKindLabels[list.kind]}
              </div>
              <h2 className="mt-3 text-lg font-semibold">{list.name}</h2>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{list.description}</p>
            </Link>
            <div className="mt-4 flex justify-end gap-1">
              <button className="rounded-full border border-border p-2 hover:bg-muted" onClick={() => setDialogList(list)} aria-label="编辑">
                <Pencil size={16} />
              </button>
              <button className="rounded-full border border-border p-2 text-red-600 hover:bg-red-50" onClick={() => removeList(list)} aria-label="删除">
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!loading && !lists.length ? (
        <div className="rounded-[24px] border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          暂无列表。
        </div>
      ) : null}
      {dialogList !== undefined ? <ListDialog list={dialogList} onClose={() => setDialogList(undefined)} onSubmit={saveList} /> : null}
    </div>
  );
}
