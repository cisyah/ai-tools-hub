import { getSettings, saveSettings, authHeaders, DEFAULTS } from "./lib/config.js";
import { THEMES, applyTheme, resolveTheme } from "./lib/themes.js";

const $ = (id) => document.getElementById(id);

function setMessage(text, kind) {
  const el = $("message");
  if (!text) {
    el.hidden = true;
    return;
  }
  el.textContent = text;
  el.className = `message ${kind || ""}`;
  el.hidden = false;
}

function currentServerUrl() {
  return $("serverUrl").value.trim().replace(/\/+$/, "");
}

function fillThemes(selected) {
  const sel = $("theme");
  sel.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "auto";
  auto.textContent = "自动跟随工作台";
  sel.appendChild(auto);
  for (const [id, theme] of Object.entries(THEMES)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = theme.name;
    sel.appendChild(opt);
  }
  sel.value = [...sel.options].some((o) => o.value === selected) ? selected : "auto";
}

async function previewTheme() {
  const themeId = await resolveTheme($("theme").value, currentServerUrl());
  applyTheme(themeId);
}

async function handleTest() {
  setMessage("");
  const serverUrl = currentServerUrl();
  if (!serverUrl) return setMessage("请先填写服务器地址。", "error");
  $("test").disabled = true;
  $("test").textContent = "测试中…";
  try {
    const res = await fetch(`${serverUrl}/api/cards?limit=1`, {
      headers: authHeaders($("apiToken").value.trim()),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setMessage("连接成功 ✓", "ok");
  } catch (err) {
    setMessage(`连接失败：${err.message}。请检查地址、网络或 token。`, "error");
  } finally {
    $("test").disabled = false;
    $("test").textContent = "测试连接";
  }
}

async function handleSave() {
  await saveSettings({
    serverUrl: currentServerUrl(),
    apiToken: $("apiToken").value.trim(),
    theme: $("theme").value,
  });
  setMessage("设置已保存 ✓", "ok");
}

async function init() {
  const settings = await getSettings();
  $("serverUrl").value = settings.serverUrl || DEFAULTS.serverUrl;
  $("apiToken").value = settings.apiToken || "";

  fillThemes(settings.theme || DEFAULTS.theme);
  await previewTheme();

  $("test").addEventListener("click", handleTest);
  $("save").addEventListener("click", handleSave);
  $("theme").addEventListener("change", previewTheme);
  $("serverUrl").addEventListener("blur", previewTheme);
}

init();
