import { NextResponse } from "next/server";
import { z } from "zod";
import { getBracelets, getProduct } from "@/lib/server/catalog";
import { getContent } from "@/lib/server/content";
import { priceFor, type Tiers } from "@/lib/pricing";
import { uiFor } from "@/lib/i18n/ui";
import { checkCoupon } from "@/lib/server/coupons";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  code: z.string().max(40),
  bracelet: z.string().max(60),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
  extras: z.array(z.string().max(60)).max(2).optional(),
  lang: z.enum(["en", "hi", "hn"]).optional(),
});

/** Preview a coupon at checkout. The real check happens again when the payment is created. */
export async function POST(req: Request) {
  if (rateLimited(`coupon:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  }
  const raw = await req.text();
  if (raw.length > 1024) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 413 });
  let parsed;
  try {
    parsed = Body.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ ok: false, error: "That coupon code isn't valid." }, { status: 400 });
  const product = await getProduct("bracelet", parsed.data.bracelet);
  if (!product) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  try {
    // Same price the checkout will charge: base bracelet plus any extra purposes.
    const [all, settings] = await Promise.all([getBracelets(), getContent("settings")]);
    const extras = [...new Set(parsed.data.extras ?? [])].filter((x) => x !== product.slug && all.some((b) => b.slug === x && b.inList));
    const tiers: Tiers = [settings.defaultPrice, settings.price2, settings.price3];
    const priceInr = priceFor(product.priceInr, 1 + extras.length, tiers);
    const r = await checkCoupon(parsed.data.code, { slug: product.slug, title: product.title, priceInr }, parsed.data.mobile || undefined, parsed.data.lang);
    return NextResponse.json(r, { status: r.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[coupon]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: uiFor(parsed.data.lang ?? "en").server.couponFailed }, { status: 500 });
  }
}
