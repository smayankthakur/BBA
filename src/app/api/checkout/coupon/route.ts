import { NextResponse } from "next/server";
import { z } from "zod";
import { getProduct } from "@/lib/server/catalog";
import { checkCoupon } from "@/lib/server/coupons";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  code: z.string().max(40),
  bracelet: z.string().max(60),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
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
    const r = await checkCoupon(parsed.data.code, product, parsed.data.mobile || undefined);
    return NextResponse.json(r, { status: r.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[coupon]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Couldn't check the coupon. Please try again." }, { status: 500 });
  }
}
