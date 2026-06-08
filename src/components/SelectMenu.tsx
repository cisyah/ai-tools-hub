"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
};

export function SelectMenu({ value, options, onChange, className = "", buttonClassName = "", menuClassName = "", ariaLabel }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 text-left text-sm outline-none transition hover:border-foreground/20 focus:border-ring ${buttonClassName}`}
      >
        <span className="min-w-0 truncate">{selected?.label || ""}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          role="listbox"
          className={`absolute left-0 top-full z-50 mt-1 max-h-72 w-full min-w-44 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-2xl ${menuClassName}`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm transition ${
                  active ? "bg-surface-strong text-foreground" : "text-muted-foreground hover:bg-surface-strong hover:text-foreground"
                }`}
              >
                <Check size={15} className={active ? "opacity-100" : "opacity-0"} />
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
