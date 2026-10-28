import { NextResponse } from "next/server";
import { langOfRequest } from "@/lib/server/lang";
import { UpgradeSchema } from "@/lib/checkoutSchema";
import { createOrder, razorpayConfigured, razorpayKeyId } from "@/lib/server/razorpay";
import { insertUpgrade, paidOrderForUpgrade } from "@/lib/server/orders";
import { getBracelets, getProduct } from "@/lib/server/catalog";
import { getContent } from "@/lib/server/content";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";
import { MAX_PURPOSES, extraFor, type Tiers } from "@/lib/pricing";
import { uiFor } from "@/lib/i18n/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Top-up after payment: add a 2nd or 3rd purpose to a paid bracelet before
 * Ammit starts designing it. Creates a second Razorpay payment for the difference.
 */
export async function POST(req: Request) {
  const Q = uiFor(langOfRequest(req)).server;
  if (!razorpayConfigured()) return NextResponse.json({ error: Q.switchingOn }, { status: 503 });
  if (rateLimited(`upgrade:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: Q.tooMany }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 2048) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let parsed;
  try {
    parsed = UpgradeSchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: uiFor("en").server.upgradeChoose }, { status: 400 });
  const M = uiFor(parsed.data.lang ?? "en").server;

  const order = await paidOrderForUpgrade(parsed.data.orderId).catch(() => null);
  if (!order) return NextResponse.json({ error: M.upgradeNotFound }, { status: 400 });
  if (order.fulfilment_status !== "new") {
    return NextResponse.json({ error: M.upgradeStarted }, { status: 409 });
  }
  const current = order.purposes?.length ? order.purposes : [order.bracelet_slug];
  const [all, settings, base] = await Promise.all([getBracelets(), getContent("settings"), getProduct("bracelet", order.bracelet_slug)]);
  const add = [...new Set(parsed.data.add)].filter((x) => !current.includes(x));
  const products = add.map((x) => all.find((b) => b.slug === x && b.inList));
  if (!add.length || products.some((p) => !p) || current.length + add.length > MAX_PURPOSES) {
    return NextResponse.json({ error: M.choosePurposes }, { status: 400 });
  }
  const tiers: Tiers = [settings.defaultPrice, settings.price2, settings.price3];
  const amountInr = extraFor(base?.priceInr ?? settings.defaultPrice, current.length, current.length + add.length, tiers);
  if (amountInr < 1) return NextResponse.json({ error: M.upgradeContact }, { status: 400 });
  const titles = products.map((p) => p!.title);

  try {
    const rzp = await createOrder(amountInr * 100, `${order.ref}-UP${current.length + add.length}`, {
      ref: order.ref,
      type: "Extra purpose after payment",
      add: titles.join(", ").slice(0, 250),
      mobile: order.mobile,
    });
    await insertUpgrade({ orderId: order.id, razorpayOrderId: rzp.id, addSlugs: products.map((p) => p!.slug), addTitles: titles, amountPaise: amountInr * 100 });
    return NextResponse.json({
      orderId: rzp.id,
      keyId: razorpayKeyId(),
      amount: amountInr * 100,
      currency: "INR",
      ref: order.ref,
      prefill: { name: order.delivery_name, email: order.email ?? undefined, contact: `+91${order.mobile}` },
    });
  } catch (e) {
    console.error("[upgrade] create failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: M.startFailed }, { status: 502 });
  }
}
