// Shared settings access for the AI Tools Hub Clipper.

export const DEFAULTS = {
  serverUrl: "http://127.0.0.1:7317",
  apiToken: "",
  defaultType: "external_link",
  theme: "auto",
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return {
    serverUrl: (stored.serverUrl || DEFAULTS.serverUrl).trim().replace(/\/+$/, ""),
    apiToken: (stored.apiToken || "").trim(),
    defaultType: (stored.defaultType || DEFAULTS.defaultType).trim(),
    theme: (stored.theme || DEFAULTS.theme).trim(),
  };
}

export async function saveSettings(values) {
  await chrome.storage.sync.set({
    serverUrl: (values.serverUrl || "").trim().replace(/\/+$/, ""),
    apiToken: (values.apiToken || "").trim(),
    defaultType: (values.defaultType || DEFAULTS.defaultType).trim(),
    theme: (values.theme || DEFAULTS.theme).trim(),
  });
}

export function authHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
