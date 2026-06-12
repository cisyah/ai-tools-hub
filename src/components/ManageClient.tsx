"use client";

import { Archive, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CardDialog } from "@/components/CardDialog";
import { CardIcon } from "@/components/icons";
import { PageTitle } from "@/components/PageTitle";
import { TagManagerPanel } from "@/components/TagsClient";
import { useTranslation } from "@/components/LocaleProvider";
import { SelectMenu } from "@/components/SelectMenu";
import { useToast } from "@/components/ToastProvider";
import { parseApiError, translateEnglish, type Translator } from "@/lib/i18n";
import { useDateFormatter } from "@/lib/i18n/hooks";
import type { Card, CardInput } from "@/lib/types";

type ManageStatusFilter = "" | "active" | "archived" | "favorite";

function cardToInput(card: Card): CardInput {
  return {
    name: card.name,
    description: card.description,
    url: card.url,
    type: card.type,
    icon: card.icon,
    previewUrl: card.previewUrl,
    previewPosition: card.previewPosition,
    sourceDomain: card.sourceDomain,
    tags: card.tags,
    notes: card.notes,
    isArchived: card.isArchived,
    isFavorite: card.isFavorite,
    sortOrder: card.sortOrder,
  };
}

function StatusPill({ card, t }: { card: Card; t: Translator }) {
  if (card.isArchived) {
    return <span className="inline-flex whitespace-nowrap rounded-lg bg-accent-soft px-2 py-1 text-xs font-medium text-app-card-muted">{t("status.archived")}</span>;
  }
  if (card.isFavorite) {
    return (
      <span className="inline-flex whitespace-nowrap items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-app-card-muted">
        <Star size={12} className="fill-accent text-accent" />
        {t("status.favourite")}
      </span>
    );
  }

  return <span className="inline-flex whitespace-nowrap rounded-lg bg-accent-soft px-2 py-1 text-xs font-medium text-app-card-muted">{t("status.active")}</span>;
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

const manageActionButton =
  "rounded-lg border border-border p-2 text-app-card-muted transition hover:bg-muted hover:text-app-card-foreground";

export function ManageClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") === "tags" ? "tags" : "apps";
  const dateFormatter = useDateFormatter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCard, setDialogCard] = useState<Card | null | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ManageStatusFilter>("");
  const { showToast } = useToast();

  const statusFilterOptions = useMemo(
    () => [
      { value: "", label: t("pages.manage.allStatus") },
      { value: "active", label: t("status.active") },
      { value: "archived", label: t("status.archived") },
      { value: "favorite", label: t("status.favourite") },
    ],
    [t],
  );

  const statItems = useMemo(
    () => [
      { key: "active", label: t("pages.manage.activeCount"), markerClass: "bg-primary" },
      { key: "archived", label: t("pages.manage.archivedCount"), markerClass: "bg-app-card-muted" },
      { key: "favourite", label: t("pages.manage.favouriteCount"), markerClass: "bg-accent" },
    ],
    [t],
  );

  async function refreshCards() {
    const response = await fetch("/api/cards?includeArchived=1");
    if (!response.ok) throw new Error(await parseApiError(response, t));
    const payload = await response.json();
    setCards(payload.cards || []);
  }

  useEffect(() => {
    refreshCards()
      .catch(() => setError(t("pages.manage.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        if (statusFilter === "active" && card.isArchived) return false;
        if (statusFilter === "archived" && !card.isArchived) return false;
        if (statusFilter === "favorite" && !card.isFavorite) return false;
        return matchesManageSearch(card, searchQuery.trim());
      }),
    [cards, searchQuery, statusFilter],
  );
  const activeCount = cards.filter((card) => !card.isArchived).length;
  const archivedCount = cards.length - activeCount;
  const favoriteCount = cards.filter((card) => card.isFavorite).length;

  const statValues: Record<string, number> = {
    active: activeCount,
    archived: archivedCount,
    favourite: favoriteCount,
  };

  async function saveCard(input: CardInput) {
    const editing = dialogCard && "id" in dialogCard;
    const response = await fetch(editing ? `/api/cards/${dialogCard.id}` : "/api/cards", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error(await parseApiError(response, t));
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
      setError(await parseApiError(response, t));
      return;
    }

    await refreshCards();
    showToast({
      message: nextArchived ? t("toast.archived", { name: card.name }) : t("toast.restored", { name: card.name }),
      actionLabel: t("toast.undo"),
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
      setError(await parseApiError(response, t));
      return;
    }

    await refreshCards();
    showToast({
      message: t("toast.deleted", { name: card.name }),
      actionLabel: t("toast.undo"),
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

  async function deleteCardFromDialog(card: Card) {
    const response = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await parseApiError(response, t));

    await refreshCards();
    showToast({
      message: t("toast.deleted", { name: card.name }),
      actionLabel: t("toast.undo"),
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
        eyebrow={translateEnglish("pages.manage.eyebrow")}
        title={t("nav.manage")}
        description={activeView === "tags" ? t("pages.manage.tagsDescription") : t("pages.manage.description")}
        action={
          activeView === "apps" ? (
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground"
              onClick={() => setDialogCard(null)}
            >
              <Plus size={17} aria-hidden="true" />
              {t("pages.home.addNew")}
            </button>
          ) : null
        }
      />
      <div className="flex gap-2 border-b border-[#EEECE5] pb-2">
        <Link
          href="/manage"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeView === "apps" ? "bg-accent-soft text-foreground" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
          }`}
        >
          {t("pages.manage.tabApps")}
        </Link>
        <Link
          href="/manage?view=tags"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeView === "tags" ? "bg-accent-soft text-foreground" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
          }`}
        >
          {t("pages.manage.tabTags")}
        </Link>
      </div>
      {activeView === "tags" ? <TagManagerPanel /> : null}
      {activeView === "apps" ? (
        <>
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <section className="space-y-3">
        <div className="grid gap-2 border-b border-[#EEECE5] py-2.5 lg:grid-cols-[minmax(280px,1fr)_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-ring"
              placeholder={t("pages.manage.searchPlaceholder")}
            />
          </label>
          <SelectMenu
            value={statusFilter}
            onChange={(nextValue) => setStatusFilter(nextValue as ManageStatusFilter)}
            options={statusFilterOptions}
            ariaLabel={t("pages.manage.status")}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("pages.manage.showing", { count: filteredCards.length, total: cards.length })}</span>
          <span>{t("pages.manage.sortedBy")}</span>
        </div>
        <div className="overflow-x-auto rounded-[18px] border border-border bg-surface">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-sm text-app-card-foreground">
            <colgroup>
              <col className="w-[54%]" />
              <col className="w-[160px]" />
              <col className="w-[92px]" />
              <col className="w-[76px]" />
              <col className="w-[112px]" />
              <col className="w-[124px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-background/70 text-left text-xs font-semibold uppercase tracking-[0.12em] text-app-card-muted">
                <th className="px-4 py-3">{t("pages.manage.tool")}</th>
                <th className="px-4 py-3">{t("pages.manage.tags")}</th>
                <th className="whitespace-nowrap px-4 py-3">{t("pages.manage.created")}</th>
                <th className="whitespace-nowrap px-4 py-3">{t("pages.manage.order")}</th>
                <th className="whitespace-nowrap px-4 py-3">{t("pages.manage.status")}</th>
                <th className="whitespace-nowrap px-4 py-3">{t("pages.manage.actions")}</th>
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <CardIcon name={card.icon} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{card.name}</div>
                        <div className="truncate text-xs text-app-card-muted">{card.sourceDomain || card.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-full flex-nowrap gap-1.5 overflow-hidden">
                      {card.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="max-w-[86px] truncate rounded-lg bg-accent-soft px-2 py-1 text-xs text-app-card-muted">
                          {tag}
                        </span>
                      ))}
                      {card.tags.length > 3 ? <span className="shrink-0 text-xs text-app-card-muted">+{card.tags.length - 3}</span> : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-app-card-muted">{dateFormatter.format(new Date(card.createdAt))}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{card.sortOrder}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusPill card={card} t={t} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className={manageActionButton} onClick={() => setDialogCard(card)} aria-label={t("toolCard.edit")}>
                        <Pencil size={16} />
                      </button>
                      <button
                        className={manageActionButton}
                        onClick={() => archiveCard(card)}
                        aria-label={card.isArchived ? t("toolCard.restore") : t("toolCard.archive")}
                      >
                        <Archive size={16} />
                      </button>
                      <button className="rounded-lg border border-border p-2 text-red-600 hover:bg-red-50" onClick={() => removeCard(card)} aria-label={t("toolCard.delete")}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredCards.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={6}>
                    {t("pages.manage.empty")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[#EEECE5] pt-4 text-sm">
          {statItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${item.markerClass}`} aria-hidden="true" />
              <span className="font-medium text-muted-foreground">{item.label}</span>
              <span className="font-semibold tabular-nums text-foreground">{statValues[item.key]}</span>
            </div>
          ))}
        </div>
      </section>
      {dialogCard !== undefined ? (
        <CardDialog
          card={dialogCard}
          onClose={() => setDialogCard(undefined)}
          onSubmit={saveCard}
          onDelete={dialogCard ? deleteCardFromDialog : undefined}
        />
      ) : null}
        </>
      ) : null}
    </div>
  );
}
