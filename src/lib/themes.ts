export const defaultThemeId = "old-burgundy";

export const themes = [
  {
    id: "buttermilk",
    name: "Buttermilk",
    description: "Creamy pale yellow",
    color: "#FFF1B5",
    textColor: "#43302E",
  },
  {
    id: "pink",
    name: "Pink",
    description: "Soft pastel rose",
    color: "#EDB4C0",
    textColor: "#43302E",
  },
  {
    id: "pastel-blue",
    name: "Pastel Blue",
    description: "Soft sky blue",
    color: "#C1DBE8",
    textColor: "#43302E",
  },
  {
    id: "rust",
    name: "Rust",
    description: "Warm burnt orange",
    color: "#BA3801",
    textColor: "#ffffff",
  },
  {
    id: "navy",
    name: "Navy",
    description: "Muted medium blue",
    color: "#4A69B3",
    textColor: "#ffffff",
  },
  {
    id: "old-burgundy",
    name: "Old Burgundy",
    description: "Deep vintage brown",
    color: "#43302E",
    textColor: "#FFF1B5",
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
