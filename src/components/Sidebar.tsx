"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, BarChart3, FolderKanban, GitMerge, List, MoreHorizontal, Pencil, Plus, Settings, Star, Tags, Trash2, Wrench } from "lucide-react";
import { ListDialog } from "@/components/ListDialog";
import { LogoMark } from "@/components/LogoMark";
import { SelectMenu } from "@/components/SelectMenu";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/ToastProvider";
import type { Card, ListInput, SavedList } from "@/lib/types";

const navItems = [
  { href: "/", label: "Tools", icon: Wrench },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/manage", label: "Manage", icon: FolderKanban },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

type SidebarList = SavedList & { count: number };

async function parseApiError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error || "请求失败。";
}

export function Sidebar() {
  const pathname = usePathname();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [lists, setLists] = useState<SidebarList[]>([]);
  const [dialogList, setDialogList] = useState<SavedList | null | undefined>(undefined);
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [mergeSource, setMergeSource] = useState<SidebarList | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [error, setError] = useState("");
  const { siteName, tagline } = useTheme();
  const { showToast } = useToast();

  async function loadLists(shouldCommit: () => boolean = () => true) {
    const [cardsResponse, listsResponse] = await Promise.all([
      fetch("/api/cards?includeArchived=1"),
      fetch("/api/lists"),
    ]);
    const cardsPayload = await cardsResponse.json();
    const listsPayload = await listsResponse.json();
    const cards = (cardsPayload.cards || []) as Card[];
    const savedLists = (listsPayload.lists || []) as SavedList[];

    const listCounts = await Promise.all(
      savedLists.slice(0, 8).map(async (list) => {
        try {
          const response = await fetch(`/api/lists/${list.id}`);
          const payload = await response.json();
          return {
            ...list,
            count: Array.isArray(payload.cards) ? payload.cards.length : 0,
          };
        } catch {
          return { ...list, count: 0 };
        }
      }),
    );

    if (!shouldCommit()) return;
    setFavoriteCount(cards.filter((card) => card.isFavorite).length);
    setLists(listCounts);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSidebarLists() {
      try {
        await loadLists(() => !cancelled);
      } catch {
        if (!cancelled) {
          setFavoriteCount(0);
          setLists([]);
        }
      }
    }

    void loadSidebarLists();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveList(input: ListInput) {
    const editing = dialogList && "id" in dialogList;
    const response = await fetch(editing ? `/api/lists/${dialogList.id}` : "/api/lists", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await parseApiError(response));
    await loadLists();
  }

  async function removeList(list: SidebarList) {
    const confirmed = window.confirm(`确认删除列表「${list.name}」？列表内卡片不会被删除。`);
    if (!confirmed) return;

    const response = await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }

    setMenuListId(null);
    await loadLists();
    showToast({ message: `已删除 ${list.name}` });
  }

  async function mergeList() {
    if (!mergeSource || !mergeTargetId) return;

    const response = await fetch(`/api/lists/${mergeSource.id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetListId: mergeTargetId }),
    });
    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }
    const payload = await response.json();

    showToast({ message: `已合并 ${payload.mergedCount || 0} 个工具到目标列表` });
    setMergeSource(null);
    setMergeTargetId("");
    setMenuListId(null);
    await loadLists();
  }

  return (
    <aside className="sticky top-0 z-20 border-b border-border bg-sidebar text-sidebar-foreground md:h-screen md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:flex md:h-full md:flex-col md:items-stretch md:px-5 md:py-7">
        <Link href="/" className="flex min-w-[168px] items-center gap-3 md:min-w-0">
          <LogoMark />
          <div>
            <div className="max-w-[150px] truncate text-base font-bold tracking-normal text-foreground">{siteName}</div>
            <div className="max-w-[150px] truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{tagline}</div>
          </div>
        </Link>
        <nav className="flex gap-1 overflow-x-auto md:mt-9 md:block md:space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition duration-200 ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={`flex min-h-11 shrink-0 items-center justify-center rounded-full px-3 transition duration-200 md:hidden ${
              pathname === "/settings" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
            }`}
            aria-label="设置"
          >
            <Settings size={17} aria-hidden="true" />
          </Link>
        </nav>
        <div className="hidden md:mt-8 md:block">
          <div className="mb-3 border-t border-border pt-5">
            <div className="flex items-center justify-between px-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Lists</div>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-strong hover:text-foreground"
                aria-label="新增列表"
                onClick={() => setDialogList(null)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Link
              href="/?favorite=favorite"
              className="relative flex min-h-9 items-center gap-2 rounded-full px-3 pr-11 text-sm font-medium text-muted-foreground transition hover:bg-surface-strong hover:text-foreground"
            >
              <Star size={17} className="text-primary" />
              <span className="min-w-0 flex-1 truncate">Favourites</span>
              {favoriteCount ? (
                <span className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-xs text-muted-foreground">
                  {favoriteCount}
                </span>
              ) : null}
            </Link>
            {lists.map((list) => (
              <div key={list.id} className="group relative">
                <Link
                  href={`/lists/${list.id}`}
                  className={`flex min-h-9 items-center gap-2 rounded-full px-3 pr-11 text-sm font-medium transition ${
                    pathname === `/lists/${list.id}`
                      ? "bg-surface-strong text-foreground"
                      : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
                  }`}
                >
                  <List size={17} />
                  <span className="min-w-0 flex-1 truncate">{list.name}</span>
                </Link>
                {list.count ? (
                  <span
                    className={`pointer-events-none absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-xs text-muted-foreground transition-opacity ${
                      menuListId === list.id ? "opacity-0" : "opacity-100 group-hover:opacity-0"
                    }`}
                  >
                    {list.count}
                  </span>
                ) : null}
                <button
                  type="button"
                  className={`absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-surface hover:text-foreground ${
                    menuListId === list.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  onClick={(event) => {
                    event.preventDefault();
                    setMenuListId(menuListId === list.id ? null : list.id);
                  }}
                  aria-label="列表操作"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuListId === list.id ? (
                  <div className="absolute right-0 top-9 z-30 w-36 rounded-lg border border-border bg-surface p-1 shadow-airbnb">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-strong"
                      onClick={() => {
                        setDialogList(list);
                        setMenuListId(null);
                      }}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-strong"
                      onClick={() => {
                        setMergeSource(list);
                        setMergeTargetId("");
                        setMenuListId(null);
                      }}
                    >
                      <GitMerge size={15} />
                      Merge
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      onClick={() => void removeList(list)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        {error ? <div className="hidden text-xs text-red-600 md:block">{error}</div> : null}
        <div className="hidden md:mt-auto md:flex md:justify-start md:pt-6">
          <Link
            href="/settings"
            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
              pathname === "/settings" ? "bg-surface-strong text-foreground" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
            }`}
            aria-label="设置"
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
      {dialogList !== undefined ? <ListDialog list={dialogList} onClose={() => setDialogList(undefined)} onSubmit={saveList} /> : null}
      {mergeSource ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Merge List</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              将「{mergeSource.name}」中的工具合并到目标手动列表，然后删除原列表。
            </p>
            <div className="mt-5 space-y-1.5">
              <span className="text-sm font-medium">Target List</span>
              <SelectMenu
                value={mergeTargetId}
                onChange={setMergeTargetId}
                options={[
                  { value: "", label: "选择目标列表" },
                  ...lists
                    .filter((list) => list.id !== mergeSource.id && list.kind === "manual")
                    .map((list) => ({ value: list.id, label: list.name })),
                ]}
                buttonClassName="h-11"
                ariaLabel="合并目标列表"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-strong"
                onClick={() => {
                  setMergeSource(null);
                  setMergeTargetId("");
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={!mergeTargetId}
                className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                onClick={() => void mergeList()}
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
