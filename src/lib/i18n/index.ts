import type { Locale } from "./locales";
import en from "./messages/en";
import zhCN from "./messages/zh-CN";
import type { Messages } from "./messages/zh-CN";

const catalogs: Record<Locale, Messages> = {
  "zh-CN": zhCN,
  en,
};

export type TranslationValues = Record<string, string | number>;

export type Translator = (key: string, values?: TranslationValues) => string;

function getNestedValue(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function createTranslator(locale: Locale): Translator {
  const messages = catalogs[locale];

  return function t(key: string, values?: TranslationValues) {
    const template = getNestedValue(messages, key) ?? getNestedValue(catalogs.en, key) ?? key;
    if (!values) return template;

    return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
  };
}

const apiErrorKeyMap: Record<string, keyof Messages["errors"] | "descriptionTooLong"> = {
  "请求失败。": "requestFailed",
  "服务器错误。": "serverError",
  "请求体格式不正确。": "invalidBody",
  "名称不能为空。": "nameRequired",
  "URL 只支持 http(s):// 或站内 /path。": "invalidUrl",
  "应用类型不正确。": "invalidCardType",
  "卡片类型不正确。": "invalidCardType",
  "排序值必须是数字。": "invalidSortOrder",
  "cardId 不能为空。": "cardIdRequired",
  "cardType 不正确。": "invalidCardTypeParam",
  "filterType 不正确。": "invalidFilterType",
  "列表名称不能为空。": "listNameRequired",
  "列表类型不正确。": "invalidListKind",
  "标签名称不能为空。": "tagNameRequired",
  "该标签已存在。": "tagExists",
  "删除失败。": "deleteFailed",
  "保存失败。": "saveFailed",
  "应用类型名称不能为空。": "typeNameRequired",
  "类型名称不能为空。": "typeNameRequired",
  "应用类型信息不完整。": "typeInfoIncomplete",
  "类型信息不完整。": "typeInfoIncomplete",
  "应用类型 id 不能为空。": "typeIdRequired",
  "类型 id 不能为空。": "typeIdRequired",
  "该应用类型名称已存在。": "typeNameExists",
  "该类型名称已存在。": "typeNameExists",
  "应用类型不存在。": "typeNotFound",
  "类型不存在。": "typeNotFound",
  "至少保留一个应用类型。": "typeMinOne",
  "至少保留一个传播类型。": "typeMinOne",
};

export function translateApiError(message: string, t: Translator): string {
  const directKey = apiErrorKeyMap[message];
  if (directKey && directKey !== "descriptionTooLong") {
    return t(`errors.${directKey}`);
  }

  const descriptionMatch = message.match(/^简介不能超过 (\d+) 字。$/);
  if (descriptionMatch) {
    return t("errors.descriptionTooLong", { max: descriptionMatch[1] });
  }

  const englishDescriptionMatch = message.match(/^Description cannot exceed (\d+) characters\.$/);
  if (englishDescriptionMatch) {
    return t("errors.descriptionTooLong", { max: englishDescriptionMatch[1] });
  }

  const typeInUseMatch = message.match(/^该应用类型仍被 (\d+) 张卡片使用，无法删除。$/);
  if (typeInUseMatch) {
    return t("errors.typeInUse", { count: typeInUseMatch[1] });
  }

  const legacyTypeInUseMatch = message.match(/^该类型仍被 (\d+) 张卡片使用，无法删除。$/);
  if (legacyTypeInUseMatch) {
    return t("errors.typeInUse", { count: legacyTypeInUseMatch[1] });
  }

  return message;
}

export async function parseApiError(response: Response, t: Translator) {
  const payload = await response.json().catch(() => ({}));
  const message = typeof payload.error === "string" ? payload.error : t("errors.requestFailed");
  return translateApiError(message, t);
}

export { catalogs };

/**
 * Always resolves against the English catalog, regardless of the active locale.
 * Used for page-title eyebrows, which are intentionally English-only.
 */
export const translateEnglish: Translator = createTranslator("en");
