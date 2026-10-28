import type { Tiers } from "@/lib/pricing";

export type QuickProduct = {
  slug: string;
  title: string;
  blurb: string;
  priceInr: number;
  photo: string | null;
  /** "for you if…" lines, offered as "what would help most" after payment */
  listA: string[];
  sphere: { color: string; shade: string; gloss?: number };
};

export type QuickData = {
  products: QuickProduct[];
  tiers: Tiers;
  minDays: number;
  maxDays: number;
  trust: { shipping: string; payment: string };
  mulank: { number: number; planet: string; planetHindi: string; traits: string[] }[];
  /** WhatsApp number in international digits (e.g. 917888835454), for "order on WhatsApp" */
  waPhone: string;
  /** Online payment switched on (Razorpay keys set) */
  payEnabled: boolean;
};
