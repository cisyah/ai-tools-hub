"use client";

import { Archive, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CardDialog } from "@/components/CardDialog";
import { CardIcon } from "@/components/icons";
import { PageTitle } from "@/components/PageTitle";
import { SelectMenu } from "@/components/SelectMenu";
import { useToast } from "@/components/ToastProvider";
import { cardTypeLabels, cardTypes, type Card, type CardInput, type CardType } from "@/lib/types";

type ManageStatusFilter = "" | "active" | "archived" | "favorite";

function cardToInput(card: Card): CardInput {
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

async function parseApiError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error || "请求失败。";
}

function StatusPill({ card }: { card: Card }) {
  if (card.isArchived) return <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Archived</span>;
  if (card.isFavorite) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-xs font-medium text-primary">
        <Star size={12} className="fill-current" />
        Favourite
      </span>
    );
  }

  return <span className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground">Active</span>;
}

function matchesManageSearch(card: Card, query: string) {
  if (!query) return true;
  const haystack = [
    card.name,
    card.description,
    card.url,
    card.sourceDomain,
    card.notes,
    ...card.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(value));
}

export function ManageClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCard, setDialogCard] = useState<Card | null | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CardType | "">("");
  const [statusFilter, setStatusFilter] = useState<ManageStatusFilter>("");
  const { showToast } = useToast();

  async function refreshCards() {
    const response = await fetch("/api/cards?includeArchived=1");
    if (!response.ok) throw new Error(await parseApiError(response));
    const payload = await response.json();
    setCards(payload.cards || []);
  }

  useEffect(() => {
    refreshCards()
      .catch(() => setError("加载卡片失败，请确认数据库已初始化。"))
      .finally(() => setLoading(false));
  }, []);

  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        if (typeFilter && card.type !== typeFilter) return false;
        if (statusFilter === "active" && card.isArchived) return false;
        if (statusFilter === "archived" && !card.isArchived) return false;
        if (statusFilter === "favorite" && !card.isFavorite) return false;
        return matchesManageSearch(card, searchQuery.trim());
      }),
    [cards, searchQuery, statusFilter, typeFilter],
  );
  const activeCount = cards.filter((card) => !card.isArchived).length;
  const archivedCount = cards.length - activeCount;
  const favoriteCount = cards.filter((card) => card.isFavorite).length;

  async function saveCard(input: CardInput) {
    const editing = dialogCard && "id" in dialogCard;
    const response = await fetch(editing ? `/api/cards/${dialogCard.id}` : "/api/cards", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error(await parseApiError(response));
    await refreshCards();
  }

  async function archiveCard(card: Card) {
    const nextArchived = !card.isArchived;
    const response = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: nextArchived }),
    });
    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }

    await refreshCards();
    showToast({
      message: `${nextArchived ? "已归档" : "已恢复"} ${card.name}`,
      actionLabel: "撤销",
      onAction: async () => {
        await fetch(`/api/cards/${card.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived: card.isArchived }),
        });
        await refreshCards();
      },
    });
  }

  async function removeCard(card: Card) {
    const response = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await parseApiError(response));
      return;
    }

    await refreshCards();
    showToast({
      message: `已删除 ${card.name}`,
      actionLabel: "撤销",
      onAction: async () => {
        await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cardToInput(card)),
        });
        await refreshCards();
      },
    });
  }

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow="Admin"
        title="Tool Management"
        description="Manage every tool in one table. Sort order controls the global order used across the app."
        action={
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
            onClick={() => setDialogCard(null)}
          >
            <Plus size={17} aria-hidden="true" />
            新增卡片
          </button>
        }
      />
      {loading ? <div className="text-sm text-muted-foreground">加载中...</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Active", value: activeCount },
          { label: "Archived", value: archivedCount },
          { label: "Favourite", value: favoriteCount },
        ].map((item) => (
          <div key={item.label} className="border-b border-border py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-3xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>
      <section className="space-y-3">
        <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 lg:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-ring"
              placeholder="搜索名称、URL、来源域名、简介、标签"
            />
          </label>
          <SelectMenu
            value={typeFilter}
            onChange={(nextValue) => setTypeFilter(nextValue as CardType | "")}
            options={[
              { value: "", label: "全部类型" },
              ...cardTypes.map((type) => ({ value: type, label: cardTypeLabels[type] })),
            ]}
            buttonClassName="h-11 rounded-lg"
            ariaLabel="管理页类型筛选"
          />
          <SelectMenu
            value={statusFilter}
            onChange={(nextValue) => setStatusFilter(nextValue as ManageStatusFilter)}
            options={[
              { value: "", label: "全部状态" },
              { value: "active", label: "Active" },
              { value: "archived", label: "Archived" },
              { value: "favorite", label: "Favourite" },
            ]}
            buttonClassName="h-11 rounded-lg"
            ariaLabel="管理页状态筛选"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>显示 {filteredCards.length} / {cards.length}</span>
          <span>按全局排序值排列</span>
        </div>
        <div className="overflow-x-auto rounded-[18px] border border-border bg-surface">
          <table className="w-full min-w-[1060px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-background/70 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => (
                <tr
                  key={card.id}
                  className={`border-b border-border transition last:border-b-0 hover:bg-background ${card.isArchived ? "opacity-55" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-white">
                        <CardIcon name={card.icon} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{card.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{card.sourceDomain || card.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-surface-strong px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {cardTypeLabels[card.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                      {card.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-lg bg-surface-strong px-2 py-1 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                      {card.tags.length > 3 ? <span className="text-xs text-muted-foreground">+{card.tags.length - 3}</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(card.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{card.sortOrder}</td>
                  <td className="px-4 py-3">
                    <StatusPill card={card} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg border border-border p-2 hover:bg-muted" onClick={() => setDialogCard(card)} aria-label="编辑">
                        <Pencil size={16} />
                      </button>
                      <button
                        className="rounded-lg border border-border p-2 hover:bg-muted"
                        onClick={() => archiveCard(card)}
                        aria-label={card.isArchived ? "恢复" : "归档"}
                      >
                        <Archive size={16} />
                      </button>
                      <button className="rounded-lg border border-border p-2 text-red-600 hover:bg-red-50" onClick={() => removeCard(card)} aria-label="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredCards.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={7}>
                    暂无匹配卡片。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      {dialogCard !== undefined ? (
        <CardDialog card={dialogCard} onClose={() => setDialogCard(undefined)} onSubmit={saveCard} />
      ) : null}
    </div>
  );
}
