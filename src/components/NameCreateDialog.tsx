"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";

type NameCreateDialogProps = {
  title: string;
  inputLabel: string;
  placeholder: string;
  submitLabel: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

export function NameCreateDialog({
  title,
  inputLabel,
  placeholder,
  submitLabel,
  saving,
  onClose,
  onSubmit,
}: NameCreateDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError("");
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.requestFailed"));
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-6">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : <div />}
          <button
            type="button"
            className="rounded-md p-2 hover:bg-surface-strong"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 px-6 pb-6">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor="create-name">
            {inputLabel}
          </label>
          <input
            id="create-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-ring"
          />
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-strong"
            onClick={onClose}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:text-primary-hover-foreground disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
