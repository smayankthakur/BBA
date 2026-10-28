import "server-only";
import { cache } from "react";
import { BRACELETS, GIFT_DETAILS, OLD_BRACELET_SLUGS } from "@/data/pages";
import { GIFTS } from "@/data/home";
import { BRACELET_VIDEOS } from "@/data/videos";
import { DEFAULTS } from "@/lib/content/defaults";
import { PRODUCT_TEXT_KEYS, type Product, type ProductI18n, type ProductKind, type ProductStatus, type Visual } from "@/lib/catalog-types";
import { PRODUCTS_HI } from "@/lib/i18n/products.hi";
import { PRODUCTS_HN } from "@/lib/i18n/products.hn";
import { getLang } from "./lang";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";
import { productPhotos, versioned } from "./photos";
import fs from "node:fs";
import path from "node:path";

/* ------------------------------------------------------------------ */
/* Built-in catalogue (used to seed the database, and when there is none) */
/* ------------------------------------------------------------------ */

function giftPhoto(slug: string) {
  for (const ext of ["jpg", "jpeg", "webp", "png"]) {
    const rel = `/products/gifts/${slug}.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", rel))) return [versioned(rel)];
  }
  return [];
}

/** Built-in Hindi/Hinglish wording for a product shipped with the site. */
const builtInI18n = (kind: ProductKind, slug: string): ProductI18n => {
  const hi = PRODUCTS_HI[`${kind}:${slug}`];
  const hn = PRODUCTS_HN[`${kind}:${slug}`];
  return { ...(hi ? { hi } : {}), ...(hn ? { hn } : {}) } as ProductI18n;
};

function builtIn(): Product[] {
  const price = DEFAULTS.settings.defaultPrice;
  const bracelets: Product[] = BRACELETS.map((b, i) => ({
    id: `builtin-bracelet-${b.slug}`,
    kind: "bracelet",
    slug: b.slug,
    title: b.title,
    blurb: b.blurb,
    intro: [...b.intro],
    listA: [...b.forWhom],
    listB: [],
    crystals: [...b.crystals],
    note: b.note ?? null,
    priceInr: price,
    sort: (i + 1) * 10,
    status: "published",
    inList: true,
    photos: productPhotos(b.slug),
    photoAlt: null,
    videoId: BRACELET_VIDEOS[b.slug]?.id ?? null,
    videoTitle: BRACELET_VIDEOS[b.slug]?.title ?? null,
    visual: { sphere: b.sphere, sphereShade: b.sphereShade, sphereGloss: b.sphereGloss, cards: b.cards, rings: b.rings },
    seoTitle: null,
    seoDescription: null,
    i18n: builtInI18n("bracelet", b.slug),
  }));
  const gifts: Product[] = GIFTS.map((g, i) => ({
    id: `builtin-gift-${g.slug}`,
    kind: "gift",
    slug: g.slug,
    title: g.title,
    blurb: g.blurb,
    intro: [...GIFT_DETAILS[g.slug].intro],
    listA: [...GIFT_DETAILS[g.slug].send],
    listB: [...GIFT_DETAILS[g.slug].ideas],
    crystals: [],
    note: null,
    priceInr: price,
    sort: (i + 1) * 10,
    status: "published",
    inList: true,
    photos: giftPhoto(g.slug),
    photoAlt: g.photoAlt,
    videoId: null,
    videoTitle: null,
    visual: {
      sphere: g.beads[0],
      sphereShade: "rgba(0,0,0,.35)",
      cards: [g.gradient, g.gradient, g.gradient],
      rings: [[...g.beads], [...g.beads], [...g.beads]],
      gradient: g.gradient,
      beads: [...g.beads],
    },
    seoTitle: null,
    seoDescription: null,
    i18n: builtInI18n("gift", g.slug),
  }));
  return [...bracelets, ...gifts];
}

/* ------------------------------------------------------------------ */
/* Database                                                             */
/* ------------------------------------------------------------------ */

type Row = {
  id: string; kind: ProductKind; slug: string; title: string; blurb: string; intro: string[]; list_a: string[]; list_b: string[];
  crystals: string[]; note: string | null; price_inr: number; sort_order: number; status: ProductStatus; in_list: boolean;
  photos: string[]; photo_alt: string | null; visual: Visual; seo_title: string | null; seo_description: string | null;
  video_id: string | null; video_title: string | null; updated_at: string | Date; i18n: ProductI18n | null;
};

const fromRow = (r: Row): Product => ({
  id: r.id,
  kind: r.kind,
  slug: r.slug,
  title: r.title,
  blurb: r.blurb,
  intro: r.intro ?? [],
  listA: r.list_a ?? [],
  listB: r.list_b ?? [],
  crystals: r.crystals ?? [],
  note: r.note,
  priceInr: r.price_inr,
  sort: r.sort_order,
  status: r.status,
  inList: r.in_list,
  photos: r.photos ?? [],
  photoAlt: r.photo_alt,
  videoId: r.video_id,
  videoTitle: r.video_title,
  // A product saved without colours still gets the default look.
  visual: r.visual && Array.isArray(r.visual.cards) && Array.isArray(r.visual.rings) ? r.visual : { ...NEW_VISUAL, ...(r.visual ?? {}), cards: NEW_VISUAL.cards, rings: NEW_VISUAL.rings },
  seoTitle: r.seo_title,
  seoDescription: r.seo_description,
  i18n: r.i18n ?? {},
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
});

let seeded: Promise<void> | null = null;
/** First run only: copy the built-in catalogue into the empty table. */
function seedOnce() {
  seeded ??= (async () => {
    await ensureSchema();
    const n = await sql<{ n: number }>`select count(*) :: int as n from products`;
    if ((n[0]?.n ?? 0) === 0) for (const p of builtIn()) await insertProduct(p);
    await migratePurposes2026();
    await migrateI18n2026();
    await migratePhotos2026();
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  return seeded;
}

/**
 * One-time move to the client's ten purposes and ₹1,200 pricing (28 Oct 2026):
 * renames the six existing bracelets (and their photo paths), adds the four new
 * ones, retires the 3 in 1, and moves every price from ₹1,199 to ₹1,200.
 */
async function migratePurposes2026() {
  await sql`create table if not exists site_migrations (id text primary key, at timestamptz not null default now())`;
  const claimed = await sql`insert into site_migrations (id) values ('purposes-2026-10') on conflict do nothing returning id`;
  if (!claimed.length) return;
  const built = builtIn().filter((p) => p.kind === "bracelet");
  for (const [oldSlug, newSlug] of Object.entries(OLD_BRACELET_SLUGS)) {
    const b = built.find((x) => x.slug === newSlug)!;
    const taken = await sql`select 1 from products where kind = 'bracelet' and slug = ${newSlug}`;
    if (taken.length) continue;
    await sql`update products set slug = ${newSlug}, title = ${b.title}, blurb = ${b.blurb}, intro = ${b.intro}, list_a = ${b.listA},
      crystals = ${b.crystals}, note = ${b.note}, video_id = coalesce(video_id, ${b.videoId}), video_title = coalesce(video_title, ${b.videoTitle}),
      photos = array(select replace(u, ${`/products/${oldSlug}/`}, ${`/products/${newSlug}/`}) from unnest(photos) u),
      sort_order = ${b.sort}, updated_at = now()
      where kind = 'bracelet' and slug = ${oldSlug}`;
  }
  for (const b of built) await insertProduct(b);
  await sql`update products set status = 'draft', in_list = false, updated_at = now() where kind = 'bracelet' and slug = '3-in-1' and status = 'published'`;
  await sql`update products set price_inr = 1200, updated_at = now() where price_inr = 1199`;
  await sql`update site_content set data = jsonb_set(data, '{defaultPrice}', '1200') where id = 'settings' and data->>'defaultPrice' = '1199'`;
}

/** One-time: give the shipped products their built-in Hindi/Hinglish wording. */
async function migrateI18n2026() {
  await sql`create table if not exists site_migrations (id text primary key, at timestamptz not null default now())`;
  const claimed = await sql`insert into site_migrations (id) values ('i18n-2026-10') on conflict do nothing returning id`;
  if (!claimed.length) return;
  for (const p of builtIn()) {
    if (!p.i18n || !Object.keys(p.i18n).length) continue;
    await sql`update products set i18n = ${JSON.stringify(p.i18n)}::jsonb where kind = ${p.kind} and slug = ${p.slug} and i18n = '{}'::jsonb`;
  }
}

/** One-time: purposes added without photos get the free-to-use photos shipped in public/products (28 Oct 2026). */
async function migratePhotos2026() {
  await sql`create table if not exists site_migrations (id text primary key, at timestamptz not null default now())`;
  const claimed = await sql`insert into site_migrations (id) values ('photos-2026-10') on conflict do nothing returning id`;
  if (!claimed.length) return;
  for (const slug of ["clarity-and-confidence", "self-healing", "delay-in-marriage", "weight-loss"]) {
    const photos = productPhotos(slug);
    if (photos.length) await sql`update products set photos = ${photos}, updated_at = now() where kind = 'bracelet' and slug = ${slug} and cardinality(photos) = 0`;
  }
}

async function insertProduct(p: Omit<Product, "id">) {
  const rows = await sql<{ id: string }>`insert into products
    (kind, slug, title, blurb, intro, list_a, list_b, crystals, note, price_inr, sort_order, status, in_list, photos, photo_alt,
     video_id, video_title, visual, seo_title, seo_description, i18n)
    values (${p.kind}, ${p.slug}, ${p.title}, ${p.blurb}, ${p.intro}, ${p.listA}, ${p.listB}, ${p.crystals}, ${p.note}, ${p.priceInr},
     ${p.sort}, ${p.status}, ${p.inList}, ${p.photos}, ${p.photoAlt}, ${p.videoId}, ${p.videoTitle}, ${JSON.stringify(p.visual)}::jsonb,
     ${p.seoTitle}, ${p.seoDescription}, ${JSON.stringify(p.i18n ?? {})}::jsonb)
    on conflict (kind, slug) do nothing returning id`;
  return rows[0]?.id ?? null;
}

/** Everything that isn't in the trash. Falls back to the built-in catalogue if the database is unavailable. */
const loadCatalog = cache(async (): Promise<Product[]> => {
  if (!dbConfigured()) return builtIn();
  try {
    await seedOnce();
    const rows = await sql<Row>`select * from products where status <> 'trash' order by kind, sort_order, created_at`;
    return rows.map(fromRow);
  } catch (e) {
    console.error("[catalog] falling back to built-in products:", e instanceof Error ? e.message : e);
    return builtIn();
  }
});

/* ------------------------------------------------------------------ */
/* Public site                                                          */
/* ------------------------------------------------------------------ */

/** Product in the page's language: translated wording where it exists, English otherwise. */
function localized(p: Product): Product {
  const lang = getLang();
  if (lang === "en") return p;
  const t = p.i18n?.[lang];
  if (!t) return p;
  const out = { ...p } as Record<string, unknown>;
  for (const k of PRODUCT_TEXT_KEYS) {
    const v = t[k];
    if (Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== "") out[k] = v;
  }
  return out as Product;
}

export async function getBracelets() {
  return (await loadCatalog()).filter((p) => p.kind === "bracelet" && p.status === "published").map(localized);
}
export async function getGifts() {
  return (await loadCatalog()).filter((p) => p.kind === "gift" && p.status === "published").map(localized);
}
export async function getProduct(kind: ProductKind, slug: string) {
  const p = (await loadCatalog()).find((p) => p.kind === kind && p.slug === slug && p.status === "published");
  return p ? localized(p) : null;
}
/** Lowest published bracelet price, for "from ₹…" lines. */
export async function lowestPrice() {
  const b = await getBracelets();
  return b.length ? Math.min(...b.map((p) => p.priceInr)) : DEFAULTS.settings.defaultPrice;
}

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

export async function adminListProducts(kind?: ProductKind, status?: ProductStatus | "all") {
  await seedOnce();
  const rows = await sql<Row>`select * from products
    where (${kind ?? ""} = '' or kind = ${kind ?? ""})
      and ((${status ?? "all"} = 'all' and status <> 'trash') or status = ${status ?? "all"})
    order by kind, sort_order, created_at`;
  return rows.map(fromRow);
}

export async function adminCounts() {
  await seedOnce();
  return sql<{ kind: ProductKind; status: ProductStatus; n: number }>`select kind, status, count(*) :: int as n from products group by kind, status`;
}

export async function adminGetProduct(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await seedOnce();
  const rows = await sql<Row>`select * from products where id = ${id}`;
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function slugTaken(kind: ProductKind, slug: string, exceptId?: string) {
  const rows = await sql<{ id: string }>`select id from products where kind = ${kind} and slug = ${slug}`;
  return rows.some((r) => r.id !== exceptId);
}

export async function createProduct(p: Omit<Product, "id">) {
  await seedOnce();
  return insertProduct(p);
}

export async function updateProduct(id: string, p: Omit<Product, "id">) {
  await sql`update products set kind = ${p.kind}, slug = ${p.slug}, title = ${p.title}, blurb = ${p.blurb}, intro = ${p.intro},
    list_a = ${p.listA}, list_b = ${p.listB}, crystals = ${p.crystals}, note = ${p.note}, price_inr = ${p.priceInr},
    sort_order = ${p.sort}, status = ${p.status}, in_list = ${p.inList}, photos = ${p.photos}, photo_alt = ${p.photoAlt},
    video_id = ${p.videoId}, video_title = ${p.videoTitle}, visual = ${JSON.stringify(p.visual)}::jsonb,
    seo_title = ${p.seoTitle}, seo_description = ${p.seoDescription}, i18n = ${JSON.stringify(p.i18n ?? {})}::jsonb, updated_at = now()
    where id = ${id}`;
}

export async function setProductStatus(id: string, status: ProductStatus) {
  await sql`update products set status = ${status}, updated_at = now() where id = ${id}`;
}

export async function deleteProductForever(id: string) {
  await sql`delete from products where id = ${id} and status = 'trash'`;
}

/** Default look for a new product, so it never shows blank cards. */
export const NEW_VISUAL: Visual = {
  sphere: "#7A3FC0",
  sphereShade: "rgba(40,10,70,.45)",
  cards: ["linear-gradient(160deg,#EEE6F8,#D6C6EE)", "linear-gradient(200deg,#F1ECF9,#DCD0F0)", "linear-gradient(180deg,#E9E1F6,#CFBDEA)"],
  rings: [
    ["#7A3FC0", "#E3C67C", "#EDEFF5"],
    ["#E3C67C", "#7A3FC0", "#7A3FC0"],
    ["#EDEFF5", "#7A3FC0", "#E3C67C"],
  ],
  gradient: "linear-gradient(170deg,#E6DAF6,#DCE0EE)",
  beads: ["#7A3FC0", "#E3C67C", "#EDEFF5"],
};

/** The purposes for the header menu (title, link, first photo), in the page language. */
export async function headerPurposes() {
  return (await getBracelets()).filter((b) => b.inList).map((b) => ({ slug: b.slug, title: b.title, photo: b.photos[0] ?? null }));
}
