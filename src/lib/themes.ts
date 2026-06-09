export const defaultThemeId = "ardoise";

export const themes = [
  {
    id: "wasabi",
    name: "Wasabi",
    subtitle: "Fresh yellow signal",
    swatches: ["#FFFFFF", "#E9F056", "#C3D240", "#5E6E19"],
  },
  {
    id: "orange-topaze",
    name: "Orange Topaze",
    subtitle: "Creative action energy",
    swatches: ["#FFFFFF", "#FFF8F5", "#FFDCCF", "#FE5C34"],
  },
  {
    id: "cool-blue",
    name: "Cool Blue",
    subtitle: "Reliable analytical blue",
    swatches: ["#FFFFFF", "#F7FBFF", "#D7EFFF", "#2E5D8A"],
  },
  {
    id: "cassis",
    name: "Cassis",
    subtitle: "Premium curated berry",
    swatches: ["#FFFFFF", "#FCF8FB", "#F1E6F0", "#351E28"],
  },
  {
    id: "vert-sauge",
    name: "Vert Sauge",
    subtitle: "Calm long-use green",
    swatches: ["#FFFFFF", "#F8FAF6", "#E9EFE6", "#4E5B41"],
  },
  {
    id: "ardoise",
    name: "Ardoise",
    subtitle: "Modern engineering neutral",
    swatches: ["#FFFFFF", "#F7F7F6", "#EBEAED", "#2F363B"],
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
