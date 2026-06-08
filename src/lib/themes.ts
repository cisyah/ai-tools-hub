export const defaultThemeId = "mist";

export const themes = [
  {
    id: "linen",
    name: "Linen",
    description: "Warm pale green",
    color: "#d9dac8",
    textColor: "#25261c",
  },
  {
    id: "mist",
    name: "Mist",
    description: "Pale blue grey",
    color: "#bdccd5",
    textColor: "#1f2426",
  },
  {
    id: "sage",
    name: "Sage",
    description: "Pale sage",
    color: "#b8bba1",
    textColor: "#202218",
  },
  {
    id: "moss",
    name: "Ochre",
    description: "Muted yellow",
    color: "#d2bd88",
    textColor: "#241f13",
  },
  {
    id: "clay",
    name: "Clay",
    description: "Dusty rose",
    color: "#bf8887",
    textColor: "#211817",
  },
  {
    id: "ink",
    name: "Slate",
    description: "Blue charcoal",
    color: "#626272",
    textColor: "#ffffff",
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
