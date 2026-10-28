import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page request.
 * - Partner links can also be written as any page with ?ref=CODE; they are
 *   sent through /p/CODE so the visit is credited, then back to the page.
 * - Languages: /hi/… and /hinglish/… are served as they are; every other
 *   page is English and is served from the /en/… pages without showing /en.
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
