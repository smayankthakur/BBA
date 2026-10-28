import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page request.
 * - Partner links can also be written as any page with ?ref=CODE; they are
 *   sent through /p/CODE so the visit is credited, then back to the page.
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
  return NextResponse.next();
}

export const config = {
  // Pages only: not the admin panel, APIs, Next.js files or static files.
  matcher: ["/((?!api|admin|p/|_next|.*\\.[\\w]+$).*)"],
};
