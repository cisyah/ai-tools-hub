"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { SelectMenu } from "@/components/SelectMenu";
import { useTranslation } from "@/components/LocaleProvider";
import { useCardTypes } from "@/lib/hooks/useCardTypes";
import type { CardType } from "@/lib/types";

type CardTypeSelectProps = {
  value: CardType | "";
  onChange: (value: CardType | "") => void;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
};

export function CardTypeSelect({
  value,
  onChange,
  includeAllOption = false,
  allOptionLabel,
  className,
  buttonClassName,
  menuClassName,
  ariaLabel,
}: CardTypeSelectProps) {
  const { t } = useTranslation();
  const { options, loading } = useCardTypes();

  const selectOptions = [
    ...(includeAllOption ? [{ value: "", label: allOptionLabel || t("filter.allTypes") }] : []),
    ...options,
  ];

  return (
    <SelectMenu
      value={value}
      onChange={(nextValue) => onChange(nextValue as CardType | "")}
      options={loading && !options.length ? [{ value: value || "", label: t("common.loading") }] : selectOptions}
      className={className}
      buttonClassName={buttonClassName}
      menuClassName={menuClassName}
      ariaLabel={ariaLabel || t("filter.typeAria")}
      menuFooter={
        <Link
          href="/tags?tab=types"
          className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-semibold text-accent transition hover:bg-surface-strong"
          onClick={(event) => event.stopPropagation()}
        >
          <Plus size={15} />
          {t("cardTypeSelect.addMore")}
        </Link>
      }
    />
  );
}
