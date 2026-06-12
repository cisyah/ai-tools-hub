import { getSettings, authHeaders } from "./lib/config.js";
import { extractPageInfo } from "./lib/extract.js";
import { applyTheme, resolveTheme } from "./lib/themes.js";

const $ = (id) => document.getElementById(id);

const isZh = navigator.language.startsWith("zh");

const i18n = {
  nameRequired: isZh ? "名称不能为空。" : "Name is required.",
  urlRequired: isZh ? "链接不能为空。" : "URL is required.",
  saving: isZh ? "保存中…" : "Saving…",
  saveFailed: (status) => isZh ? `保存失败（${status}）` : `Save failed (${status})`,
  saved: isZh ? "已保存到 AI Tools Hub ✓" : "Saved to AI Tools Hub ✓",
  savedBtn: isZh ? "已保存" : "Saved",
  saveError: isZh ? "保存失败，请检查服务器地址和 Token。" : "Save failed. Check server URL and token.",
  saveBtn: isZh ? "保存到 Hub" : "Save to Hub",
  fetchUrlFirst: isZh ? "请先填写链接。" : "Please enter a URL first.",
  fetching: isZh ? "抓取中…" : "Fetching…",
  fetchFailed: (status) => isZh ? `抓取失败（${status}）` : `Fetch failed (${status})`,
  xhsNotSupported: isZh ? "⚠️ 小红书暂不支持自动提取，请手动填写标题和上传封面图片" : "⚠️ Xiaohongshu doesn't support auto-extraction. Please fill in title and cover image manually.",
  title: isZh ? "标题" : "Title",
  cover: isZh ? "封面图" : "Cover image",
  desc: isZh ? "简介" : "Description",
  autofillAll: isZh ? "已自动填写全部信息 ✓" : "All fields auto-filled ✓",
  autofillNone: isZh ? "⚠️ 未能提取到任何信息，请手动填写标题、简介和上传封面图片" : "⚠️ Could not extract any info. Please fill in title, description, and cover image manually.",
  autofillPartial: (missing) => isZh ? `已自动填写，还需手动补充：${missing.join("、")}` : `Auto-filled. Still needed: ${missing.join(", ")}`,
  fetchError: (msg) => isZh ? `⚠️ ${msg || "抓取失败"}，请手动填写标题、简介和上传封面图片` : `⚠️ ${msg || "Fetch failed"}. Please fill in manually.`,
  fetchPreview: isZh ? "抓取预览图" : "Fetch preview",
  linkExtracted: isZh ? "已自动提取链接" : "URL extracted",
  xhsWarning: isZh ? "小红书链接需手动填写标题和上传封面图片" : "Xiaohongshu links require manual title and cover image.",
};

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
  toast: $("toast"),
  save: $("save"),
};

let settings = null;
let previewUrl = "";
let iconUrl = "";
let sourceDomain = "";
let toastTimer = null;

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

function showToast(text, kind = "ok") {
  if (!els.toast) return;
  clearTimeout(toastTimer);
  els.toast.textContent = text;
  els.toast.className = `toast toast-${kind}`;
  els.toast.hidden = false;
  els.toast.offsetHeight; // force reflow
  els.toast.classList.add("toast-visible");
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("toast-visible");
    setTimeout(() => { els.toast.hidden = true; }, 300);
  }, 3000);
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
  if (!name) return setMessage(i18n.nameRequired, "error");
  if (!url) return setMessage(i18n.urlRequired, "error");

  els.save.disabled = true;
  els.save.textContent = i18n.saving;

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
      throw new Error(data?.error || i18n.saveFailed(res.status));
    }
    showToast(i18n.saved, "ok");
    els.save.textContent = i18n.savedBtn;
    setTimeout(() => window.close(), 900);
  } catch (err) {
    showToast(err.message || i18n.saveError, "error");
    els.save.disabled = false;
    els.save.textContent = i18n.saveBtn;
  }
}

async function handleFetchPreview() {
  const url = els.url.value.trim();
  if (!url) return setMessage(i18n.fetchUrlFirst, "error");
  els.fetchPreview.disabled = true;
  els.fetchPreview.textContent = i18n.fetching;
  try {
    const res = await fetch(`${settings.serverUrl}/api/cards/metadata`, {
      method: "POST",
      headers: authHeaders(settings.apiToken),
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || i18n.fetchFailed(res.status));
    const meta = data?.metadata || {};

    if (meta.platform === "xiaohongshu" && !meta.title) {
      setMessage(i18n.xhsNotSupported, "warn");
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

    const missing = [];
    if (!meta.title) missing.push(i18n.title);
    if (!meta.previewUrl) missing.push(i18n.cover);
    if (!meta.description && !meta.author) missing.push(i18n.desc);

    if (missing.length === 0) {
      showToast(i18n.autofillAll, "ok");
    } else if (missing.length === 3) {
      setMessage(i18n.autofillNone, "warn");
    } else {
      setMessage(i18n.autofillPartial(missing), "warn");
    }
  } catch (err) {
    setMessage(i18n.fetchError(err.message), "error");
  } finally {
    els.fetchPreview.disabled = false;
    els.fetchPreview.textContent = i18n.fetchPreview;
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

  els.url.addEventListener("paste", (event) => {
    const pasted = event.clipboardData.getData("text/plain").trim();
    if (/^https?:\/\/\S+$/.test(pasted)) return;
    const match = pasted.match(/https?:\/\/[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/);
    if (match) {
      const url = match[0].replace(/[，。！？、；：）】》"'\u3002\uff0c\uff01\uff1f\uff1b\uff1a\uff09\u3011\u300b]+$/, "");
      event.preventDefault();
      els.url.value = url;
      showToast(i18n.linkExtracted, "ok");
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

  if (info.platform === "xiaohongshu") {
    setMessage(i18n.xhsWarning, "warn");
  }

  hide(els.loading);
  show(els.form);
  els.name.focus();
}

init();
