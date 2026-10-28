/**
 * Site languages. English lives at the root (/bracelets), Hindi under /hi
 * and Hinglish under /hinglish. The admin panel stays in English.
 */
export const LANGS = ["en", "hi", "hn"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

/** URL segment for each language ("" = root). */
export const SEGMENT: Record<Lang, string> = { en: "en", hi: "hi", hn: "hinglish" };
export const PREFIX: Record<Lang, string> = { en: "", hi: "/hi", hn: "/hinglish" };
/** <html lang> and hreflang codes */
export const HTML_LANG: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", hn: "hi-Latn" };
export const HREFLANG: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", hn: "hi-Latn-IN" };
export const OG_LOCALE: Record<Lang, string> = { en: "en_IN", hi: "hi_IN", hn: "en_IN" };
/** Name of each language, written in that language (for the switcher). */
export const LANG_NAME: Record<Lang, string> = { en: "English", hi: "हिन्दी", hn: "Hinglish" };
/** Dates and numbers */
export const INTL_LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", hn: "en-IN" };

export const isLang = (x: unknown): x is Lang => typeof x === "string" && (LANGS as readonly string[]).includes(x);
export const langFromSegment = (seg: string | undefined): Lang | null =>
  seg === "en" ? "en" : seg === "hi" ? "hi" : seg === "hinglish" ? "hn" : null;

/** Site-relative path in a language: lp("hi", "/bracelets") → "/hi/bracelets". */
export function lp(lang: Lang, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (/^\/(admin|api|p|_next)(\/|$)/.test(path) || /^\/[^?#]*\.\w+([?#].*)?$/.test(path)) return path;
  const pre = PREFIX[lang];
  if (!pre) return path;
  if (path === "/") return pre;
  if (path.startsWith("/#") || path.startsWith("/?")) return pre + path.slice(1);
  return pre + path;
}

/** Strip a language prefix from a browser path: "/hi/bracelets" → { lang: "hi", path: "/bracelets" }. */
export function splitPath(pathname: string): { lang: Lang; path: string } {
  for (const l of ["hi", "hn"] as const) {
    const pre = PREFIX[l];
    if (pathname === pre || pathname.startsWith(pre + "/")) return { lang: l, path: pathname.slice(pre.length) || "/" };
  }
  // English pages are served from /en internally; on the server usePathname()
  // can report that rewritten path, so drop the /en as well.
  if (pathname === "/en" || pathname.startsWith("/en/")) return { lang: "en", path: pathname.slice(3) || "/" };
  return { lang: "en", path: pathname || "/" };
}

/** canonical + hreflang alternates for a page path ("/bracelets"). */
export function alternatesFor(lang: Lang, path: string) {
  return {
    canonical: lp(lang, path),
    languages: {
      [HREFLANG.en]: lp("en", path),
      [HREFLANG.hi]: lp("hi", path),
      [HREFLANG.hn]: lp("hn", path),
      "x-default": lp("en", path),
    },
  };
}
