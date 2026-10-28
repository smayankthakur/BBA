import { NextResponse } from "next/server";
import { REF_COOKIE, REF_DAYS, VISITOR_COOKIE, findActivePartner, newVisitorId, recordClick } from "@/lib/server/partners";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Partner link: /p/CODE (optionally ?to=/some/page). Credits the partner, then opens the site. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const url = new URL(req.url);
  const code = (await params).code.toLowerCase();
  const toRaw = url.searchParams.get("to") ?? "/";
  // Only same-site paths, never another website.
  const to = /^\/(?!\/)[\w\-./?=&%]*$/.test(toRaw) && !toRaw.startsWith("/p/") && !toRaw.startsWith("/admin") ? toRaw : "/";
  const res = NextResponse.redirect(new URL(to, url.origin), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  const partner = await findActivePartner(code).catch(() => null);
  if (!partner) return res;

  const cookie = req.headers.get("cookie") ?? "";
  let visitor = /(?:^|;\s*)bba_vid=([\w-]{10,40})/.exec(cookie)?.[1];
  if (!visitor) {
    visitor = newVisitorId();
    res.cookies.set(VISITOR_COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 365 * 86400 });
  }
  res.cookies.set(REF_COOKIE, partner.code, { httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: REF_DAYS * 86400 });
  await recordClick(partner.code, visitor, to).catch((e) => console.error("[partner] click", e instanceof Error ? e.message : e));
  return res;
}
