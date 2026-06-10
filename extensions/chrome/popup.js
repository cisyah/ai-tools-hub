import { getSettings, authHeaders } from "./lib/config.js";
import { extractPageInfo } from "./lib/extract.js";
import { applyTheme, resolveTheme } from "./lib/themes.js";

const $ = (id) => document.getElementById(id);

const els = {
  loading: $("loading"),
  form: $("form"),
  setup: $("setup"),
  name: $("name"),
  description: $("description"),
  descCount: $("desc-count"),
  url: $("url"),
  favorite: $("favorite"),
  tags: $("tags"),
  previewThumb: $("preview-thumb"),
  fetchPreview: $("fetch-preview"),
  message: $("message"),
  save: $("save"),
};

let settings = null;
let previewUrl = "";
let iconUrl = "";
let sourceDomain = "";

function show(el) {
  el.hidden = false;
}
function hide(el) {
  el.hidden = true;
}

function setMessage(text, kind) {
  if (!text) {
    hide(els.message);
    return;
  }
  els.message.textContent = text;
  els.message.className = `message ${kind || ""}`;
  show(els.message);
}

function setPreview(url) {
  previewUrl = url || "";
  els.previewThumb.style.backgroundImage = previewUrl ? `url("${previewUrl}")` : "";
}

function updateDescCount() {
  els.descCount.textContent = `${els.description.value.length}/120`;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function extractFromTab(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractPageInfo,
  });
  return results?.[0]?.result || null;
}

function parseTags(value) {
  return value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

async function handleSave() {
  setMessage("");
  const name = els.name.value.trim();
  const url = els.url.value.trim();
  if (!name) return setMessage("名称不能为空。", "error");
  if (!url) return setMessage("链接不能为空。", "error");

  els.save.disabled = true;
  els.save.textContent = "保存中…";

  const payload = {
    name,
    description: els.description.value.trim(),
    url,
    icon: iconUrl,
    previewUrl: previewUrl || null,
    sourceDomain: sourceDomain,
    tags: parseTags(els.tags.value),
    notes: "",
    isFavorite: els.favorite.checked,
    isArchived: false,
    sortOrder: 0,
  };

  try {
    const res = await fetch(`${settings.serverUrl}/api/cards`, {
      method: "POST",
      headers: authHeaders(settings.apiToken),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `保存失败（${res.status}）`);
    }
    setMessage("已保存到 AI Tools Hub ✓", "ok");
    els.save.textContent = "已保存";
    setTimeout(() => window.close(), 900);
  } catch (err) {
    setMessage(err.message || "保存失败，请检查服务器地址和 Token。", "error");
    els.save.disabled = false;
    els.save.textContent = "保存到 Hub";
  }
}

async function handleFetchPreview() {
  const url = els.url.value.trim();
  if (!url) return setMessage("请先填写链接。", "error");
  els.fetchPreview.disabled = true;
  els.fetchPreview.textContent = "抓取中…";
  try {
    const res = await fetch(`${settings.serverUrl}/api/cards/metadata`, {
      method: "POST",
      headers: authHeaders(settings.apiToken),
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `抓取失败（${res.status}）`);
    const meta = data?.metadata || {};

    // 小红书：完全无法提取，提示手动填写
    if (meta.platform === "xiaohongshu" && !meta.title) {
      setMessage("⚠️ 小红书暂不支持自动提取，请手动填写标题和上传封面图片", "warn");
      return;
    }

    if (meta.previewUrl) setPreview(meta.previewUrl);
    if (!els.name.value && meta.title) {
      els.name.value = meta.title;
    }
    if (meta.author && !els.description.value) {
      els.description.value = meta.author;
      updateDescCount();
    }
    if (!els.description.value && meta.description) {
      els.description.value = meta.description;
      updateDescCount();
    }

    // 检查哪些字段没拿到，给出具体提示
    const missing = [];
    if (!meta.title) missing.push("标题");
    if (!meta.previewUrl) missing.push("封面图");
    if (!meta.description && !meta.author) missing.push("简介");

    if (missing.length === 0) {
      setMessage("已自动填写全部信息 ✓", "ok");
    } else if (missing.length === 3) {
      setMessage("⚠️ 未能提取到任何信息，请手动填写标题、简介和上传封面图片", "warn");
    } else {
      setMessage(`已自动填写，还需手动补充：${missing.join("、")}`, "warn");
    }
  } catch (err) {
    setMessage(`⚠️ ${err.message || "抓取失败"}，请手动填写标题、简介和上传封面图片`, "error");
  } finally {
    els.fetchPreview.disabled = false;
    els.fetchPreview.textContent = "抓取预览图";
  }
}

async function init() {
  settings = await getSettings();

  resolveTheme(settings.theme, settings.serverUrl).then(applyTheme);

  els.description.addEventListener("input", updateDescCount);
  els.save.addEventListener("click", handleSave);
  els.fetchPreview.addEventListener("click", handleFetchPreview);
  $("open-options").addEventListener("click", () => chrome.runtime.openOptionsPage());
  $("go-options").addEventListener("click", () => chrome.runtime.openOptionsPage());

  // 粘贴时自动从分享文本中提取 URL
  els.url.addEventListener("paste", (event) => {
    const pasted = event.clipboardData.getData("text/plain").trim();
    if (/^https?:\/\/\S+$/.test(pasted)) return; // 纯 URL，不处理
    const match = pasted.match(/https?:\/\/[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/);
    if (match) {
      const url = match[0].replace(/[，。！？、；：）】》"'\u3002\uff0c\uff01\uff1f\uff1b\uff1a\uff09\u3011\u300b]+$/, "");
      event.preventDefault();
      els.url.value = url;
      setMessage("已自动提取链接", "ok");
    }
  });

  if (!settings.serverUrl) {
    hide(els.loading);
    show(els.setup);
    return;
  }

  const tab = await getActiveTab();
  let info = null;
  try {
    if (tab?.id != null) info = await extractFromTab(tab.id);
  } catch {
    info = null;
  }

  if (!info) {
    info = {
      name: tab?.title || "",
      description: "",
      url: tab?.url || "",
      previewUrl: "",
      icon: tab?.favIconUrl || "",
      sourceDomain: "",
    };
  }

  els.name.value = info.name || "";
  els.description.value = info.description || "";
  els.url.value = info.url || "";
  iconUrl = info.icon || tab?.favIconUrl || "";
  sourceDomain = info.sourceDomain || "";
  setPreview(info.previewUrl || "");
  updateDescCount();

  // 小红书：打开时就提示
  if (info.platform === "xiaohongshu") {
    setMessage("小红书链接需手动填写标题和上传封面图片", "warn");
  }

  hide(els.loading);
  show(els.form);
  els.name.focus();
}

init();
