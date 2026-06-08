"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import type { TagCount } from "@/lib/types";

async function parseApiError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error || "请求失败。";
}

export function TagsClient() {
  const [tags, setTags] = useState<TagCount[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshTags() {
    const response = await fetch("/api/tags?includeArchived=1");
    if (!response.ok) throw new Error(await parseApiError(response));
    const payload = await response.json();
    setTags(payload.tags || []);
  }

  useEffect(() => {
    refreshTags()
      .catch(() => setError("加载标签失败，请确认数据库已初始化。"))
      .finally(() => setLoading(false));
  }, []);

  async function renameTag(oldName: string) {
    const newName = window.prompt("请输入新的标签名称", oldName)?.trim();
    if (!newName || newName === oldName) return;

    const response = await fetch("/api/tags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName }),
    });

    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }

    await refreshTags();
    setSelectedTag(newName);
  }

  async function removeTag(name: string) {
    const confirmed = window.confirm(`确认从所有卡片中删除标签「${name}」？`);
    if (!confirmed) return;

    const response = await fetch(`/api/tags?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }

    await refreshTags();
    setSelectedTag("");
  }

  const maxCount = Math.max(...tags.map((tag) => tag.count), 0);
  const selected = useMemo(() => tags.find((tag) => tag.name === selectedTag) || tags[0], [selectedTag, tags]);

  return (
    <div className="page-shell space-y-5">
      <PageTitle eyebrow="Taxonomy" title="Tags" description="Tags are derived from cards. Renaming or deleting a tag updates every card that uses it." />
      {loading ? <div className="text-sm text-muted-foreground">加载中...</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {tags.length ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-[22px] border border-border bg-surface p-5">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-semibold">Tag cloud</h2>
                <p className="mt-1 text-sm text-muted-foreground">Frequently used tags appear more prominently.</p>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{tags.length} tags</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {tags.map((tag) => {
                const weight = maxCount ? tag.count / maxCount : 0;
                const active = selected?.name === tag.name;
                const sizeClass = weight > 0.66 ? "text-xl px-4 py-2.5" : weight > 0.33 ? "text-base px-3.5 py-2" : "text-sm px-3 py-1.5";

                return (
                  <button
                    key={tag.name}
                    className={`rounded-xl border font-semibold transition ${sizeClass} ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-foreground/40"
                    }`}
                    onClick={() => setSelectedTag(tag.name)}
                  >
                    {tag.name}
                    <span className="ml-2 text-current/55">{tag.count}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <aside className="rounded-[22px] border border-border bg-surface p-5">
            {selected ? (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Selected tag</div>
                  <div className="mt-2 break-words text-3xl font-bold">{selected.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{selected.count} cards use this tag</div>
                </div>
                <div className="space-y-2">
                  <button
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
                    onClick={() => renameTag(selected.name)}
                  >
                    <RefreshCw size={16} />
                    Rename
                  </button>
                  <button
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => removeTag(selected.name)}
                  >
                    <Trash2 size={16} />
                    Delete everywhere
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
      {!loading && !tags.length ? (
        <div className="rounded-[24px] border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          暂无标签。
        </div>
      ) : null}
    </div>
  );
}
