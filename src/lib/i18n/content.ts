import type { Lang } from "./config";
import { CONTENT_HI } from "./content.hi";
import { CONTENT_HN } from "./content.hn";

/** Built-in translations of page text (translatable fields only), per language. */
export const CONTENT_TR: Record<Exclude<Lang, "en">, Record<string, Record<string, unknown>>> = { hi: CONTENT_HI, hn: CONTENT_HN };
