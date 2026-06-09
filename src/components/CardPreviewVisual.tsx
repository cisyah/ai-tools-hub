"use client";

import { useEffect, useState } from "react";
import { CardIcon } from "@/components/icons";

type CardPreviewVisualProps = {
  previewUrl: string | null;
  icon: string;
  className?: string;
  imageClassName?: string;
  emptyLabel?: string;
};

export function CardPreviewVisual({
  previewUrl,
  icon,
  className = "relative h-36 overflow-hidden bg-muted sm:h-40",
  imageClassName = "h-full w-full object-cover object-top",
  emptyLabel,
}: CardPreviewVisualProps) {
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => {
    setPreviewBroken(false);
  }, [previewUrl]);

  if (previewUrl && !previewBroken) {
    return (
      <div className={className}>
        <img
          src={previewUrl}
          alt=""
          className={imageClassName}
          loading="lazy"
          onError={() => setPreviewBroken(true)}
        />
      </div>
    );
  }

  const showEmptyLabel = !previewUrl && emptyLabel;

  return (
    <div className={`flex items-center justify-center bg-[linear-gradient(135deg,var(--accent-soft),#ffffff)] text-foreground ${className}`}>
      {showEmptyLabel ? (
        <span className="px-3 text-center text-xs text-muted-foreground">{emptyLabel}</span>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-white">
          <CardIcon name={icon} size={28} />
        </div>
      )}
    </div>
  );
}
