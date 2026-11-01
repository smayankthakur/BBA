import "server-only";
import { cache } from "react";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";
import { getLang } from "./lang";
import { ARTICLE_TEXT_KEYS, type Article, type ArticleI18n } from "@/lib/article-types";
import { BUILT_IN_ARTICLES } from "@/data/articles";

type Row = {
  id: string; slug: string; title: string; excerpt: string; body: string; cover: string | null; purpose: string | null;
  status: "draft" | "published"; seo_title: string | null; seo_description: string | null; i18n: ArticleI18n | null;
  published_at: Date | null; updated_at: Date | null;
};
const fromRow = (r: Row): Article => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  body: r.body,
  cover: r.cover,
  purpose: r.purpose,
  status: r.status,
  seoTitle: r.seo_title,
  seoDescription: r.seo_description,
  i18n: r.i18n ?? {},
  publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
});

const builtIn = (): Article[] =>
  BUILT_IN_ARTICLES.map((a, i) => ({
    id: `built-in-${i}`,
    slug: a.slug,
    ...a.en,
    cover: null,
    purpose: a.purpose,
    status: "published" as const,
    i18n: { hi: a.hi, hn: a.hn },
    publishedAt: a.date,
    updatedAt: a.date,
  }));

/** One-time: the first articles written for the site (31 Oct 2026). */
let seeded: Promise<void> | null = null;
function seed() {
  seeded ??= (async () => {
    await ensureSchema();
    await sql`create table if not exists site_migrations (id text primary key, at timestamptz not null default now())`;
    const claimed = await sql`insert into site_migrations (id) values ('articles-2026-10') on conflict do nothing returning id`;
    if (!claimed.length) return;
    for (const a of builtIn())
      await sql`insert into articles (slug, title, excerpt, body, purpose, status, seo_title, seo_description, i18n, published_at)
        values (${a.slug}, ${a.title}, ${a.excerpt}, ${a.body}, ${a.purpose}, 'published', ${a.seoTitle ?? null}, ${a.seoDescription ?? null},
          ${JSON.stringify(a.i18n)}::jsonb, ${a.publishedAt}) on conflict (slug) do nothing`;
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  return seeded;
}

const loadAll = cache(async (): Promise<Article[]> => {
  if (!dbConfigured()) return builtIn();
  try {
    await seed();
    const rows = await sql<Row>`select * from articles order by coalesce(published_at, created_at) desc`;
    return rows.map(fromRow);
  } catch (e) {
    console.error("[articles] falling back to built-in", e instanceof Error ? e.message : e);
    return builtIn();
  }
});

/** Article in the page's language; missing translations fall back to English. */
export function localizeArticle(a: Article, lang = getLang()): Article {
  if (lang === "en") return a;
  const t = a.i18n?.[lang];
  if (!t) return a;
  const out = { ...a } as Record<string, unknown>;
  for (const k of ARTICLE_TEXT_KEYS) {
    const v = t[k];
    if (typeof v === "string" && v.trim()) out[k] = v;
  }
  return out as Article;
}

export async function listArticles() {
  return (await loadAll()).filter((a) => a.status === "published").map((a) => localizeArticle(a));
}
export async function getArticle(slug: string) {
  const a = (await loadAll()).find((x) => x.slug === slug && x.status === "published");
  return a ? localizeArticle(a) : null;
}
export async function articlesForPurpose(purpose: string) {
  return (await listArticles()).filter((a) => a.purpose === purpose);
}

/* ---------------- Admin ---------------- */

export async function adminListArticles() {
  await seed();
  return (await sql<Row>`select * from articles order by updated_at desc`).map(fromRow);
}
export async function adminGetArticle(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await seed();
  const rows = await sql<Row>`select * from articles where id = ${id}`;
  return rows[0] ? fromRow(rows[0]) : null;
}
export async function articleSlugTaken(slug: string, exceptId?: string) {
  const rows = await sql`select 1 from articles where slug = ${slug} and id <> ${exceptId ?? "00000000-0000-0000-0000-000000000000"}::uuid`;
  return rows.length > 0;
}
export type ArticleInput = {
  slug: string; title: string; excerpt: string; body: string; cover: string | null; purpose: string | null;
  status: "draft" | "published"; seoTitle: string | null; seoDescription: string | null;
};
export async function createArticle(a: ArticleInput) {
  await seed();
  const rows = await sql<{ id: string }>`insert into articles (slug, title, excerpt, body, cover, purpose, status, seo_title, seo_description, published_at)
    values (${a.slug}, ${a.title}, ${a.excerpt}, ${a.body}, ${a.cover}, ${a.purpose}, ${a.status}, ${a.seoTitle}, ${a.seoDescription},
      ${a.status === "published" ? new Date().toISOString() : null}) returning id`;
  return rows[0].id;
}
export async function updateArticle(id: string, a: ArticleInput) {
  await sql`update articles set slug = ${a.slug}, title = ${a.title}, excerpt = ${a.excerpt}, body = ${a.body}, cover = ${a.cover},
    purpose = ${a.purpose}, status = ${a.status}, seo_title = ${a.seoTitle}, seo_description = ${a.seoDescription},
    published_at = case when ${a.status} = 'published' then coalesce(published_at, now()) else published_at end, updated_at = now()
    where id = ${id}`;
}
export async function updateArticleTranslation(id: string, lang: "hi" | "hn", t: Record<string, string>) {
  await sql`update articles set i18n = jsonb_set(i18n, ${`{${lang}}`}::text[], ${JSON.stringify(t)}::jsonb, true), updated_at = now() where id = ${id}`;
}
export async function deleteArticle(id: string) {
  await sql`delete from articles where id = ${id}`;
}
