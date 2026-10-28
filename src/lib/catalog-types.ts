/** Shapes shared by the server, the admin panel and client components. */

export type Triplet = [string, string, string];

export type Visual = {
  /** Sphere colour in lists */
  sphere: string;
  sphereShade: string;
  sphereGloss?: number;
  /** Card background gradients shown behind illustrations */
  cards: Triplet;
  /** Bead-ring colours used when there is no photo */
  rings: [Triplet, Triplet, Triplet];
  /** Gifts: arch background and bead colours */
  gradient?: string;
  beads?: Triplet;
};

export type ProductKind = "bracelet" | "gift";
export type ProductStatus = "published" | "draft" | "trash";

export type Product = {
  id: string;
  kind: ProductKind;
  slug: string;
  title: string;
  blurb: string;
  intro: string[];
  /** Bracelets: "for you if…"; gifts: "what to send us" */
  listA: string[];
  /** Gifts: "gift ideas" */
  listB: string[];
  crystals: string[];
  note: string | null;
  priceInr: number;
  sort: number;
  status: ProductStatus;
  /** Bracelets: shown in the homepage intention list and the reading's choices */
  inList: boolean;
  photos: string[];
  photoAlt: string | null;
  videoId: string | null;
  videoTitle: string | null;
  visual: Visual;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Hindi / Hinglish wording; anything missing falls back to English */
  i18n?: ProductI18n;
  updatedAt?: string;
};

export const PRODUCT_TEXT_KEYS = ["title", "blurb", "intro", "listA", "listB", "crystals", "note", "photoAlt", "videoTitle", "seoTitle", "seoDescription"] as const;
export type ProductTextKey = (typeof PRODUCT_TEXT_KEYS)[number];
export type ProductText = Partial<Pick<Product, ProductTextKey>>;
export type ProductI18n = Partial<Record<"hi" | "hn", ProductText>>;

/** What the 60-second reading needs to know about each bracelet. */
export type FunnelProduct = Pick<Product, "slug" | "title" | "blurb" | "crystals" | "priceInr" | "photos" | "inList" | "visual">;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
