/** Articles (Admin → Articles; /articles on the site). */
export type ArticleText = { title: string; excerpt: string; body: string; seoTitle?: string | null; seoDescription?: string | null };
export type ArticleI18n = Partial<Record<"hi" | "hn", Partial<ArticleText>>>;
export type Article = ArticleText & {
  id: string;
  slug: string;
  cover: string | null;
  /** Bracelet this article leads to (its web address) */
  purpose: string | null;
  status: "draft" | "published";
  i18n: ArticleI18n;
  publishedAt: string | null;
  updatedAt: string | null;
};
export const ARTICLE_TEXT_KEYS = ["title", "excerpt", "body", "seoTitle", "seoDescription"] as const;
