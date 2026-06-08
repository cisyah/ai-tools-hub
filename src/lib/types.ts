export const cardTypes = ["my_app", "external_link", "doc", "tutorial", "inspiration", "case_study"] as const;

export type CardType = (typeof cardTypes)[number];
export type FavoriteFilter = "" | "favorite" | "normal";
export type ArchivedFilter = "active" | "archived" | "all";
export type ListKind = "manual" | "smart";

export type ListFilters = {
  searchQuery: string;
  type: CardType | "";
  tags: string[];
  archived: ArchivedFilter;
  favorite: FavoriteFilter;
};

export type Card = {
  id: string;
  name: string;
  description: string;
  url: string;
  type: CardType;
  icon: string;
  previewUrl: string | null;
  sourceDomain: string;
  tags: string[];
  notes: string;
  isArchived: boolean;
  isFavorite: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CardInput = {
  name: string;
  description: string;
  url: string;
  type: CardType;
  icon: string;
  previewUrl?: string | null;
  sourceDomain: string;
  tags: string[];
  notes: string;
  isArchived: boolean;
  isFavorite: boolean;
  sortOrder: number;
};

export type OpenEventInput = {
  cardId: string;
  cardType: CardType;
  searchQuery: string;
  filterType: CardType | "";
  filterTags: string[];
};

export type SavedList = {
  id: string;
  name: string;
  description: string;
  kind: ListKind;
  filters: ListFilters;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ListInput = {
  name: string;
  description: string;
  kind: ListKind;
  filters: ListFilters;
  sortOrder: number;
};

export type MetadataResult = {
  title: string;
  description: string;
  previewUrl: string | null;
  sourceDomain: string;
};

export type TagCount = {
  name: string;
  count: number;
};

export type StatsSummary = {
  totalOpens: number;
  last7Days: number;
  last30Days: number;
  daily: Array<{ eventDay: string; count: number }>;
  topCards: Array<{ cardId: string; name: string; count: number }>;
  typeDistribution: Array<{ type: CardType; count: number }>;
  tagDistribution: TagCount[];
};

export const cardTypeLabels: Record<CardType, string> = {
  my_app: "我的应用",
  external_link: "外部链接",
  doc: "文档",
  tutorial: "教程",
  inspiration: "灵感",
  case_study: "案例",
};

export const defaultListFilters: ListFilters = {
  searchQuery: "",
  type: "",
  tags: [],
  archived: "active",
  favorite: "",
};

export const listKindLabels: Record<ListKind, string> = {
  manual: "手动列表",
  smart: "智能列表",
};
