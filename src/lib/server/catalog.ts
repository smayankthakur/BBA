import "server-only";
import { cache } from "react";
import { BRACELETS, GIFT_DETAILS } from "@/data/pages";
import { GIFTS } from "@/data/home";
import { BRACELET_VIDEOS } from "@/data/videos";
import { DEFAULTS } from "@/lib/content/defaults";
import type { Product, ProductKind, ProductStatus, Visual } from "@/lib/catalog-types";
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
    inList: b.slug !== "3-in-1",
    photos: productPhotos(b.slug),
    photoAlt: null,
    videoId: BRACELET_VIDEOS[b.slug]?.id ?? null,
    videoTitle: BRACELET_VIDEOS[b.slug]?.title ?? null,
    visual: { sphere: b.sphere, sphereShade: b.sphereShade, sphereGloss: b.sphereGloss, cards: b.cards, rings: b.rings },
    seoTitle: null,
    seoDescription: null,
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
  video_id: string | null; video_title: string | null; updated_at: string | Date;
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
  visual: r.visual,
  seoTitle: r.seo_title,
  seoDescription: r.seo_description,
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
});

let seeded: Promise<void> | null = null;
/** First run only: copy the built-in catalogue into the empty table. */
function seedOnce() {
  seeded ??= (async () => {
    await ensureSchema();
    const n = await sql<{ n: number }>`select count(*) :: int as n from products`;
    if ((n[0]?.n ?? 0) > 0) return;
    for (const p of builtIn()) await insertProduct(p);
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  return seeded;
}

async function insertProduct(p: Omit<Product, "id">) {
  const rows = await sql<{ id: string }>`insert into products
    (kind, slug, title, blurb, intro, list_a, list_b, crystals, note, price_inr, sort_order, status, in_list, photos, photo_alt,
     video_id, video_title, visual, seo_title, seo_description)
    values (${p.kind}, ${p.slug}, ${p.title}, ${p.blurb}, ${p.intro}, ${p.listA}, ${p.listB}, ${p.crystals}, ${p.note}, ${p.priceInr},
     ${p.sort}, ${p.status}, ${p.inList}, ${p.photos}, ${p.photoAlt}, ${p.videoId}, ${p.videoTitle}, ${JSON.stringify(p.visual)}::jsonb,
     ${p.seoTitle}, ${p.seoDescription})
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

export async function getBracelets() {
  return (await loadCatalog()).filter((p) => p.kind === "bracelet" && p.status === "published");
}
export async function getGifts() {
  return (await loadCatalog()).filter((p) => p.kind === "gift" && p.status === "published");
}
export async function getProduct(kind: ProductKind, slug: string) {
  return (await loadCatalog()).find((p) => p.kind === kind && p.slug === slug && p.status === "published") ?? null;
}
/** The 3 in 1 (shown in its own homepage section) */
export async function getCombo() {
  return getProduct("bracelet", "3-in-1");
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
    seo_title = ${p.seoTitle}, seo_description = ${p.seoDescription}, updated_at = now()
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
