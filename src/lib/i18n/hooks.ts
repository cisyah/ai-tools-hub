"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useCardTypes } from "@/lib/hooks/useCardTypes";
import { defaultCardTypes, type ListKind } from "@/lib/types";

export function useCardTypeLabels(): Record<string, string> {
  const { t } = useTranslation();
  const { labelMap } = useCardTypes();

  return useMemo(() => {
    const labels = { ...labelMap };
    for (const type of defaultCardTypes) {
      labels[type] = labelMap[type] || t(`cardTypes.${type}`);
    }
    return labels;
  }, [labelMap, t]);
}

export function useListKindLabels(): Record<ListKind, string> {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      manual: t("listKinds.manual"),
      smart: t("listKinds.smart"),
    }),
    [t],
  );
}

export function useDateFormatter() {
  const { locale } = useTranslation();

  return useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
      }),
    [locale],
  );
}
