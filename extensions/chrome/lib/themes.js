// Theme palettes mirrored from the app's globals.css so the extension UI can
// match the workbench. Keep ids in sync with src/lib/themes.ts.

export const DEFAULT_THEME_ID = "ardoise";

export const THEMES = {
  wasabi: {
    name: "Wasabi",
    primary: "#5E6E19",
    primaryForeground: "#ffffff",
    background: "#FAFAF5",
    surface: "#ffffff",
    foreground: "#1E2118",
    muted: "#6F725F",
    border: "#E8EAD8",
    soft: "#F7F9D7",
  },
  "orange-topaze": {
    name: "Orange Topaze",
    primary: "#FE5C34",
    primaryForeground: "#ffffff",
    background: "#FFF8F5",
    surface: "#ffffff",
    foreground: "#211814",
    muted: "#7A6259",
    border: "#F1D5CC",
    soft: "#FFDCCF",
  },
  "cool-blue": {
    name: "Cool Blue",
    primary: "#2E5D8A",
    primaryForeground: "#ffffff",
    background: "#F7FBFF",
    surface: "#ffffff",
    foreground: "#0F1B2D",
    muted: "#5F7185",
    border: "#D9E8F3",
    soft: "#D7EFFF",
  },
  cassis: {
    name: "Cassis",
    primary: "#351E28",
    primaryForeground: "#ffffff",
    background: "#FCF8FB",
    surface: "#ffffff",
    foreground: "#1A1215",
    muted: "#74636B",
    border: "#E7D8E3",
    soft: "#F1E6F0",
  },
  "vert-sauge": {
    name: "Vert Sauge",
    primary: "#4E5B41",
    primaryForeground: "#ffffff",
    background: "#F8FAF6",
    foreground: "#1B1F1A",
    surface: "#ffffff",
    muted: "#687263",
    border: "#DDE5D8",
    soft: "#E9EFE6",
  },
  ardoise: {
    name: "Ardoise",
    primary: "#2F363B",
    primaryForeground: "#ffffff",
    background: "#F7F7F6",
    surface: "#ffffff",
    foreground: "#181B1A",
    muted: "#6C7072",
    border: "#DEDEDB",
    soft: "#EBEAED",
  },
};

export function isThemeId(value) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(THEMES, value);
}

export function applyTheme(themeId) {
  const theme = THEMES[isThemeId(themeId) ? themeId : DEFAULT_THEME_ID];
  const root = document.documentElement.style;
  root.setProperty("--primary", theme.primary);
  root.setProperty("--primary-foreground", theme.primaryForeground);
  root.setProperty("--bg", theme.surface);
  root.setProperty("--page-bg", theme.background);
  root.setProperty("--fg", theme.foreground);
  root.setProperty("--muted", theme.muted);
  root.setProperty("--border", theme.border);
  root.setProperty("--field-bg", theme.soft);
}

// Reads the theme the user selected inside the workbench. The choice lives in
// the app's localStorage (key "ai-tools-hub.theme"), so we peek into an open
// hub tab. Returns a valid theme id or null when no hub tab is available.
export async function detectAppTheme(serverUrl) {
  if (!serverUrl) return null;
  let origin;
  try {
    origin = new URL(serverUrl).origin;
  } catch {
    return null;
  }

  try {
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    for (const tab of tabs) {
      if (tab.id == null) continue;
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () =>
          window.localStorage.getItem("ai-tools-hub.theme") ||
          document.documentElement.dataset.theme ||
          null,
      });
      if (res?.result && isThemeId(res.result)) return res.result;
    }
  } catch {
    // No access or no hub tab open.
  }
  return null;
}

// Resolves which theme to use given the saved preference ("auto" or an id).
// In auto mode: try the live workbench, then the last detected theme, then default.
export async function resolveTheme(themePref, serverUrl) {
  if (themePref && themePref !== "auto" && isThemeId(themePref)) {
    return themePref;
  }

  const detected = await detectAppTheme(serverUrl);
  if (detected) {
    chrome.storage.local.set({ lastDetectedTheme: detected });
    return detected;
  }

  const cached = await chrome.storage.local.get({ lastDetectedTheme: "" });
  if (isThemeId(cached.lastDetectedTheme)) return cached.lastDetectedTheme;

  return DEFAULT_THEME_ID;
}
