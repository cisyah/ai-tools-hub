"use client";

import { useEffect, useState } from "react";
import { CardIcon } from "@/components/icons";

type CardPreviewVisualProps = {
  previewUrl: string | null;
  previewPosition?: string;
  icon: string;
  className?: string;
  imageClassName?: string;
  emptyLabel?: string;
};

function toProxyUrl(url: string): string {
  if (!url.startsWith("http")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export function CardPreviewVisual({
  previewUrl,
  previewPosition = "50% 0%",
  icon,
  className = "relative h-36 overflow-hidden bg-surface sm:h-40",
  imageClassName = "h-full w-full object-cover",
  emptyLabel,
}: CardPreviewVisualProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [triedProxy, setTriedProxy] = useState(false);

  useEffect(() => {
    setImgSrc(previewUrl);
    setTriedProxy(false);
  }, [previewUrl]);

  const handleError = () => {
    if (!triedProxy && imgSrc && imgSrc.startsWith("http")) {
      // 直接加载失败，走代理
      setTriedProxy(true);
      setImgSrc(toProxyUrl(imgSrc));
    } else {
      // 代理也失败了，显示 fallback
      setImgSrc(null);
    }
  };

  if (imgSrc) {
    return (
      <div className={className}>
        <img
          src={imgSrc}
          alt=""
          className={imageClassName}
          style={{ objectPosition: previewPosition }}
          loading="lazy"
          onError={handleError}
        />
      </div>
    );
  }

  const showEmptyLabel = !previewUrl && emptyLabel;

  return (
    <div className={`flex items-center justify-center bg-surface text-foreground ${className}`}>
      {showEmptyLabel ? (
        <span className="px-3 text-center text-xs text-muted-foreground">{emptyLabel}</span>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface">
          <CardIcon name={icon} size={28} />
        </div>
      )}
    </div>
  );
}
