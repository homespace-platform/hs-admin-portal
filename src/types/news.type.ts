export type NewsStatus = "DRAFT" | "PUBLISHED";
export type NewsCategory =
  "MARKET" | "LEGAL" | "GUIDE" | "INVESTMENT" | "TREND";
export type NewsBlockType = "PARAGRAPH" | "HEADING" | "QUOTE" | "IMAGE";
export type NewsMediaRole = "THUMBNAIL" | "CONTENT";

export type NewsContentBlock = {
  type: NewsBlockType;
  text: string | null;
  storageObjectId: string | null;
  altText: string | null;
};

export type NewsMedia = {
  id: string;
  storageObjectId: string;
  role: NewsMediaRole;
  sortOrder: number;
  altText: string | null;
  url: string | null;
};

export type NewsUpsertRequest = {
  title: string;
  slug: string;
  summary: string;
  category: NewsCategory;
  status: NewsStatus;
  featured: boolean;
  tags: string[];
  thumbnailStorageObjectId: string | null;
  contentBlocks: NewsContentBlock[];
};

export type NewsResponse = Omit<
  NewsUpsertRequest,
  "thumbnailStorageObjectId"
> & {
  id: string;
  thumbnailUrl: string | null;
  media: NewsMedia[];
  authorId: string;
  authorName: string;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type NewsSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: NewsCategory;
  status: NewsStatus;
  featured: boolean;
  tags: string[];
  thumbnailUrl: string | null;
  authorName: string;
  publishedAt: string | null;
  createdAt: string | null;
};

export type NewsQueryParams = {
  page?: number;
  size?: number;
  status?: NewsStatus;
  category?: NewsCategory;
  keyword?: string;
  sort?: string;
};
