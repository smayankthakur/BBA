import data from "./articles.json";
import type { ArticleText } from "@/lib/article-types";

/**
 * The first articles (31 Oct 2026), copied into the database on first use.
 * After that, edit them in Admin → Articles.
 */
type BuiltIn = { slug: string; purpose: string | null; en: ArticleText; hi: Partial<ArticleText>; hn: Partial<ArticleText>; date?: string };
export const BUILT_IN_ARTICLES = (data as BuiltIn[]).map((a) => ({ ...a, date: a.date ?? "2026-10-31T06:00:00.000Z" }));
