"use client";

import { X } from "lucide-react";
import { useState } from "react";

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  morePlaceholder?: string;
  removeLabel?: (tag: string) => string;
};

function normalizeTagName(value: string) {
  return value
    .replace(/^#+/, "")
    .replace(/^[,，、;；\s]+|[,，、;；\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map(normalizeTagName).filter(Boolean)));
}

function parseTagDraft(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const chunks = trimmed.includes("#")
    ? trimmed.split("#").flatMap((chunk) => chunk.split(/[,，、;；\n]+/))
    : trimmed.split(/[,，、;；\n]+/);

  return uniqueTags(chunks);
}

export function TagInput({ tags, onChange, placeholder, morePlaceholder, removeLabel }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addDraftTags() {
    const nextTags = parseTagDraft(draft);
    if (!nextTags.length) return false;
    onChange(uniqueTags([...tags, ...nextTags]));
    setDraft("");
    return true;
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item !== tag));
  }

  return (
    <div className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1.5 transition focus-within:border-ring">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-sm font-medium text-foreground"
        >
          <span className="min-w-0 truncate">#{tag}</span>
          <button
            type="button"
            className="rounded-full p-0.5 text-muted-foreground hover:bg-background/70 hover:text-foreground"
            onClick={() => removeTag(tag)}
            aria-label={removeLabel?.(tag) ?? `Remove "${tag}"`}
          >
            <X size={13} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            addDraftTags();
          }
          if (event.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder={tags.length ? (morePlaceholder ?? placeholder ?? "") : (placeholder ?? "")}
        className="h-7 min-w-[120px] flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-neutral-400"
      />
    </div>
  );
}
