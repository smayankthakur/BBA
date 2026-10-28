import { NextResponse } from "next/server";
import { UpgradeSchema } from "@/lib/checkoutSchema";
import { createOrder, razorpayConfigured, razorpayKeyId } from "@/lib/server/razorpay";
import { insertUpgrade, paidOrderForUpgrade } from "@/lib/server/orders";
import { getBracelets, getProduct } from "@/lib/server/catalog";
import { getContent } from "@/lib/server/content";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";
import { MAX_PURPOSES, extraFor, type Tiers } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Top-up after payment: add a 2nd or 3rd purpose to a paid bracelet before
 * Ammit starts designing it. Creates a second Razorpay payment for the difference.
 */
export async function POST(req: Request) {
  if (!razorpayConfigured()) return NextResponse.json({ error: "Online payment is being switched on. Please try again in a little while." }, { status: 503 });
  if (rateLimited(`upgrade:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 2048) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let parsed;
  try {
    parsed = UpgradeSchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Please choose a purpose to add." }, { status: 400 });

  const order = await paidOrderForUpgrade(parsed.data.orderId).catch(() => null);
  if (!order) return NextResponse.json({ error: "We couldn't find your paid order. Please message us on WhatsApp to add a purpose." }, { status: 400 });
  if (order.fulfilment_status !== "new") {
    return NextResponse.json({ error: "Ammit has already started designing your bracelet. Please message us on WhatsApp to add a purpose." }, { status: 409 });
  }
  const current = order.purposes?.length ? order.purposes : [order.bracelet_slug];
  const [all, settings, base] = await Promise.all([getBracelets(), getContent("settings"), getProduct("bracelet", order.bracelet_slug)]);
  const add = [...new Set(parsed.data.add)].filter((x) => !current.includes(x));
  const products = add.map((x) => all.find((b) => b.slug === x && b.inList));
  if (!add.length || products.some((p) => !p) || current.length + add.length > MAX_PURPOSES) {
    return NextResponse.json({ error: "Please choose your purposes again." }, { status: 400 });
  }
  const tiers: Tiers = [settings.defaultPrice, settings.price2, settings.price3];
  const amountInr = extraFor(base?.priceInr ?? settings.defaultPrice, current.length, current.length + add.length, tiers);
  if (amountInr < 1) return NextResponse.json({ error: "Please message us on WhatsApp to add a purpose." }, { status: 400 });
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
    return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
  }
}
