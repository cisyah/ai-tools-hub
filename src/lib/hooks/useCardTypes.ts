"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { parseApiError, translateApiError } from "@/lib/i18n";
import { defaultCardTypes, isDefaultCardType, type CardType, type CardTypeUsage } from "@/lib/types";

export function useCardTypes() {
  const { t } = useTranslation();
  const [types, setTypes] = useState<CardTypeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/card-types");
    if (!response.ok) throw new Error(await parseApiError(response, t));
    const payload = await response.json();
    setTypes(payload.types || []);
  }, [t]);

  useEffect(() => {
    refresh()
      .catch((err) =>
        setError(err instanceof Error ? translateApiError(err.message, t) : t("errors.cardTypesLoadFailed")),
      )
      .finally(() => setLoading(false));
  }, [refresh, t]);

  const getLocalizedLabel = useCallback(
    (typeId: string, apiLabel?: string) => {
      if (isDefaultCardType(typeId)) {
        return t(`cardTypes.${typeId}`);
      }
      return apiLabel || typeId;
    },
    [t],
  );

  const labelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const type of types) {
      map[type.id] = getLocalizedLabel(type.id, type.label);
    }
    for (const type of defaultCardTypes) {
      map[type] = t(`cardTypes.${type}`);
    }
    return map;
  }, [getLocalizedLabel, t, types]);

  const options = useMemo(
    () => types.map((type) => ({ value: type.id, label: getLocalizedLabel(type.id, type.label) })),
    [getLocalizedLabel, types],
  );

  function getLabel(type: CardType | ""): string {
    if (!type) return "";
    return labelMap[type] || type;
  }

  return { types, labelMap, options, getLabel, loading, error, refresh };
}
