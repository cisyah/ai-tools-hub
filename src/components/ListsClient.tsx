"use client";

import Link from "next/link";
import { ListFilter, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListDialog } from "@/components/ListDialog";
import { PageTitle } from "@/components/PageTitle";
import { useTranslation } from "@/components/LocaleProvider";
import { parseApiError, translateEnglish } from "@/lib/i18n";
import { useListKindLabels } from "@/lib/i18n/hooks";
import type { ListInput, SavedList } from "@/lib/types";

export function ListsClient() {
  const { t } = useTranslation();
  const listKindLabels = useListKindLabels();
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogList, setDialogList] = useState<SavedList | null | undefined>(undefined);
  const [deleteListTarget, setDeleteListTarget] = useState<SavedList | null>(null);
  const [deletingList, setDeletingList] = useState(false);
  const [deletingListCards, setDeletingListCards] = useState(false);

  async function refreshLists() {
    const response = await fetch("/api/lists");
    if (!response.ok) throw new Error(await parseApiError(response, t));
    const payload = await response.json();
    setLists(payload.lists || []);
  }

  useEffect(() => {
    refreshLists()
      .catch(() => setError(t("pages.lists.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  async function saveList(input: ListInput) {
    const editing = dialogList && "id" in dialogList;
    const response = await fetch(editing ? `/api/lists/${dialogList.id}` : "/api/lists", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await parseApiError(response, t));
    await refreshLists();
  }

  async function removeList(list: SavedList, deleteCards = false) {
    if (deleteCards) setDeletingListCards(true);
    else setDeletingList(true);

    const response = await fetch(`/api/lists/${list.id}${deleteCards ? "?deleteCards=1" : ""}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await parseApiError(response, t));
      setDeletingList(false);
      setDeletingListCards(false);
      return;
    }
    setDeleteListTarget(null);
    setDeletingList(false);
    setDeletingListCards(false);
    await refreshLists();
  }

  return (
    <div className="page-shell space-y-5">
      <PageTitle
        eyebrow={translateEnglish("pages.lists.eyebrow")}
        title={t("nav.lists")}
        description={t("pages.lists.description")}
        action={
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground"
            onClick={() => setDialogList(null)}
          >
            <Plus size={17} />
            {t("pages.lists.addList")}
          </button>
        }
      />
      {loading ? <div className="text-sm text-muted-foreground">{t("common.loading")}</div> : null}
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
              <button className="rounded-full border border-border p-2 hover:bg-muted" onClick={() => setDialogList(list)} aria-label={t("common.edit")}>
                <Pencil size={16} />
              </button>
              <button className="rounded-full border border-border p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteListTarget(list)} aria-label={t("common.delete")}>
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!loading && !lists.length ? (
        <div className="rounded-[24px] border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
          {t("pages.lists.empty")}
        </div>
      ) : null}
      {dialogList !== undefined ? <ListDialog list={dialogList} onClose={() => setDialogList(undefined)} onSubmit={saveList} /> : null}
      {deleteListTarget ? (
        <ConfirmDialog
          title={t("common.confirmDelete")}
          message={t("sidebar.deleteListConfirm", { name: deleteListTarget.name })}
          confirmLabel={deletingList ? t("common.deleting") : t("sidebar.deleteListOnly")}
          cancelLabel={t("common.cancel")}
          secondaryConfirmLabel={deletingListCards ? t("common.deleting") : t("sidebar.deleteListCards")}
          confirmVariant="destructiveOutline"
          secondaryConfirmVariant="destructive"
          busy={deletingList}
          secondaryBusy={deletingListCards}
          onCancel={() => setDeleteListTarget(null)}
          onConfirm={() => removeList(deleteListTarget)}
          onSecondaryConfirm={() => removeList(deleteListTarget, true)}
        />
      ) : null}
    </div>
  );
}
