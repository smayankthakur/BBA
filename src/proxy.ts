import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, isLang, lp, splitPath } from "@/lib/i18n/config";

/**
 * Runs before every page request.
 * - Partner links can also be written as any page with ?ref=CODE; they are
 *   sent through /p/CODE so the visit is credited, then back to the page.
 * - Languages: /hi/… and /hinglish/… are served as they are; every other
 *   page is English and is served from the /en/… pages without showing /en.
 * - ?lang=en|hi|hn (the language switcher and the first-visit chooser)
 *   remembers the choice in a cookie and opens the page in that language.
 * - A visitor who chose Hindi or Hinglish and opens a plain (English) address
 *   is sent to the same page in their language. Addresses that already say
 *   /hi or /hinglish are shown as asked (a shared link stays as shared).
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const ref = url.searchParams.get("ref");
  if (ref && /^[A-Za-z0-9][A-Za-z0-9-]{1,30}$/.test(ref)) {
    const back = new URL(url);
    back.searchParams.delete("ref");
    const to = back.pathname + back.search;
    return NextResponse.redirect(new URL(`/p/${ref.toLowerCase()}?to=${encodeURIComponent(to)}`, url.origin), 302);
  }

  const path = url.pathname;
  const pick = url.searchParams.get("lang");
  if (isLang(pick)) {
    const to = new URL(url);
    to.searchParams.delete("lang");
    to.pathname = lp(pick, splitPath(path).path);
    const res = NextResponse.redirect(to, 303);
    res.cookies.set(LANG_COOKIE, pick, { path: "/", maxAge: LANG_COOKIE_MAX_AGE, sameSite: "lax" });
    return res;
  }
  const chosen = req.cookies.get(LANG_COOKIE)?.value;
  const isEnglishPath = !(path === "/hi" || path.startsWith("/hi/") || path === "/hinglish" || path.startsWith("/hinglish/") || path === "/en" || path.startsWith("/en/"));
  if (isEnglishPath && (chosen === "hi" || chosen === "hn") && req.method === "GET") {
    const to = new URL(url);
    to.pathname = lp(chosen, path);
    const res = NextResponse.redirect(to, 307);
    res.headers.set("Vary", "Cookie");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
  if (path === "/en" || path.startsWith("/en/")) {
    const clean = new URL(url);
    clean.pathname = path.slice(3) || "/";
    return NextResponse.redirect(clean, 308);
  }
  if (path === "/hi" || path.startsWith("/hi/") || path === "/hinglish" || path.startsWith("/hinglish/")) return NextResponse.next();
  const inner = new URL(url);
  inner.pathname = `/en${path === "/" ? "" : path}`;
  return NextResponse.rewrite(inner);
}

export const config = {
  // Pages only: not the admin panel, APIs, partner links, Next.js files or static files.
  matcher: ["/((?!api|admin|p/|_next|.*\\.[\\w]+$).*)"],
};
