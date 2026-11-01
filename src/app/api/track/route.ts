import { NextResponse } from "next/server";
import { z } from "zod";
import { trackOrder } from "@/lib/server/orders";
import { getBracelets } from "@/lib/server/catalog";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";
import { langOfRequest } from "@/lib/server/lang";
import { uiFor } from "@/lib/i18n/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  ref: z.string().trim().toUpperCase().regex(/^BBA-[A-F0-9]{8}$/),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
});

/** Customer order tracking: order number + the mobile it was placed with. */
export async function POST(req: Request) {
  const lang = langOfRequest(req);
  const T = uiFor(lang).track;
  // Guessing protection: few tries per visitor.
  if (rateLimited(`track:${clientIp(req)}`, 12, 15 * 60_000)) return NextResponse.json({ error: T.tooMany }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 500) return NextResponse.json({ error: T.notFound }, { status: 400 });
  let parsed;
  try {
    parsed = Body.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: T.notFound }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: T.check }, { status: 400 });
  const t = await trackOrder(parsed.data.ref, parsed.data.mobile).catch(() => null);
  if (!t) return NextResponse.json({ error: T.notFound }, { status: 404 });
  // Purpose names in the visitor's language
  const all = await getBracelets();
  const titles = t.purposes.map((s) => {
    const b = all.find((x) => x.slug === s);
    return (lang !== "en" && b?.i18n?.[lang]?.title) || b?.title || s;
  });
  return NextResponse.json({ ...t, purposes: titles }, { headers: { "Cache-Control": "no-store" } });
}
