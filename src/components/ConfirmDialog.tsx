"use client";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  secondaryConfirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  onSecondaryConfirm?: () => void | Promise<void>;
  destructive?: boolean;
  confirmVariant?: "primary" | "destructive" | "destructiveOutline";
  secondaryConfirmVariant?: "primary" | "destructive" | "destructiveOutline";
  busy?: boolean;
  secondaryBusy?: boolean;
};

function actionClassName(variant: "primary" | "destructive" | "destructiveOutline") {
  if (variant === "destructive") return "bg-red-600 text-white hover:bg-red-700";
  if (variant === "destructiveOutline") return "border border-red-200 bg-surface text-red-600 hover:bg-red-50";
  return "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-hover-foreground";
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  secondaryConfirmLabel,
  onCancel,
  onConfirm,
  onSecondaryConfirm,
  destructive = false,
  confirmVariant,
  secondaryConfirmVariant = "destructiveOutline",
  busy = false,
  secondaryBusy = false,
}: ConfirmDialogProps) {
  const primaryVariant = confirmVariant || (destructive ? "destructive" : "primary");
  const actionBusy = busy || secondaryBusy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[10px] border border-border bg-surface p-5 shadow-airbnb">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-app-card-muted">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-app-card-muted transition hover:bg-surface-strong hover:text-foreground"
            onClick={onCancel}
            disabled={actionBusy}
          >
            {cancelLabel}
          </button>
          {secondaryConfirmLabel && onSecondaryConfirm ? (
            <button
              type="button"
              className={`h-9 rounded-md px-3 text-sm font-medium transition disabled:opacity-60 ${actionClassName(secondaryConfirmVariant)}`}
              onClick={() => void onSecondaryConfirm()}
              disabled={actionBusy}
            >
              {secondaryConfirmLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={`h-9 rounded-md px-3 text-sm font-medium transition disabled:opacity-60 ${actionClassName(primaryVariant)}`}
            onClick={() => void onConfirm()}
            disabled={actionBusy}
          >
            {busy ? confirmLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
