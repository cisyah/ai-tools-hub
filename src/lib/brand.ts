export const addCardButtonLabel = "Add New";

export const defaultLogoIconId = "dots";
export const defaultSiteName = "AI Tools Hub";
export const defaultTagline = "self hosted";

export const logoIconOptions = [
  { id: "dots", label: "Dots", description: "Directory grid" },
  { id: "sparkles", label: "Sparkles", description: "AI and ideas" },
  { id: "wrench", label: "Wrench", description: "Tools and setup" },
  { id: "library", label: "Library", description: "Knowledge base" },
  { id: "search", label: "Search", description: "Discovery" },
  { id: "app", label: "App", description: "Workspace" },
  { id: "book", label: "Book", description: "Docs and notes" },
  { id: "images", label: "Images", description: "Visual saves" },
] as const;

export type LogoIconId = (typeof logoIconOptions)[number]["id"];

export function isLogoIconId(value: string | null): value is LogoIconId {
  return logoIconOptions.some((option) => option.id === value);
}
