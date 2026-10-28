import { NextResponse } from "next/server";
import { langOfRequest } from "@/lib/server/lang";
import crypto from "node:crypto";
import { CheckoutSchema } from "@/lib/checkoutSchema";
import { createOrder, razorpayConfigured, razorpayKeyId } from "@/lib/server/razorpay";
import { insertOrder } from "@/lib/server/orders";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";
import { getBracelets, getProduct } from "@/lib/server/catalog";
import { getContent } from "@/lib/server/content";
import { attributionFor } from "@/lib/server/partners";
import { priceFor, type Tiers } from "@/lib/pricing";
import { uiFor } from "@/lib/i18n/ui";
import { checkCoupon } from "@/lib/server/coupons";
import { bhagyank, isValidDate, mulank } from "@/lib/numerology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 8 * 1024;

export async function POST(req: Request) {
  const Q = uiFor(langOfRequest(req)).server;
  if (!razorpayConfigured()) {
    return NextResponse.json({ error: Q.switchingOn }, { status: 503 });
  }
  if (rateLimited(`create:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: Q.tooMany }, { status: 429 });
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "Request too large." }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: Q.checkDetails, fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const M = uiFor(d.lang ?? "en").server;
  const product = await getProduct("bracelet", d.bracelet);
  const { day, month, year } = d.wearer;
  if (!product || !isValidDate(day, month, year)) {
    return NextResponse.json({ error: M.checkDetails }, { status: 400 });
  }

  // Price is decided here (product, purposes, coupon from the database), never by the browser.
  const [all, settings] = await Promise.all([getBracelets(), getContent("settings")]);
  const extraSlugs = [...new Set(d.extras ?? [])].filter((x) => x !== product.slug);
  const extras = extraSlugs.map((x) => all.find((b) => b.slug === x && b.inList));
  if (extras.some((x) => !x)) return NextResponse.json({ error: M.choosePurposes }, { status: 400 });
  const tiers: Tiers = [settings.defaultPrice, settings.price2, settings.price3];
  const listInr = priceFor(product.priceInr, 1 + extras.length, tiers);
  const purposeSlugs = [product.slug, ...extras.map((x) => x!.slug)];
  const title = [product.title, ...extras.map((x) => x!.title)].join(" + ");

  let couponCode: string | null = null;
  let discountInr = 0;
  if (d.coupon) {
    const c = await checkCoupon(d.coupon, { slug: product.slug, title: product.title, priceInr: listInr }, d.contact.mobile, d.lang).catch(() => ({ ok: false as const, error: M.couponFailed }));
    if (!c.ok) return NextResponse.json({ error: c.error, field: "coupon" }, { status: 400 });
    couponCode = c.code;
    discountInr = c.discountInr;
  }
  const amountPaise = (listInr - discountInr) * 100;
  const partner = await attributionFor(req, amountPaise).catch(() => null);
  const ref = `BBA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const dob = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const m = mulank(day);
  const b = bhagyank(day, month, year);
  const addr = [d.address.line1, d.address.line2, d.address.landmark, d.address.city, d.address.state, d.address.pincode]
    .filter(Boolean)
    .join(", ");

  // Razorpay notes: max 15 keys, 256 chars each. This is also the order record
  // when no database is configured.
  const cut = (s: string) => s.slice(0, 250);
  const notes: Record<string, string> = {
    ref,
    // (Razorpay allows 15 notes, so the coupon rides along with the bracelet.)
    bracelet: cut(
      [title, couponCode && `coupon ${couponCode} -Rs ${discountInr} (list Rs ${listInr})`, partner && `partner ${partner.code}`].filter(Boolean).join(" · "),
    ),
    wearer: cut(`${d.wearer.firstName} ${d.wearer.lastName ?? ""}`.trim()),
    dob,
    gender: d.wearer.gender ?? "not given yet",
    numbers: `mulank ${m}, bhagyank ${b}`,
    wrist: d.wearer.wrist,
    intentions: cut(d.intentions.join(", ")),
    deliver_to: cut(d.contact.deliveryName),
    mobile: d.contact.mobile,
    email: d.contact.email ?? "",
    address: cut(addr),
    gift: d.isGift ? cut(`yes${d.giftNote ? `: ${d.giftNote}` : ""}`) : "no",
    focus: cut(d.focus ?? ""),
    marketing: d.marketing ? "yes" : "no",
  };

  try {
    const order = await createOrder(amountPaise, ref, notes);
    await insertOrder({
      ref,
      status: "pending",
      bracelet_slug: product.slug,
      bracelet_title: title,
      amount_paise: amountPaise,
      wearer_first_name: d.wearer.firstName,
      wearer_last_name: d.wearer.lastName ?? "",
      wearer_dob: dob,
      wearer_gender: d.wearer.gender ?? "unspecified",
      mulank: m,
      bhagyank: b,
      wrist: d.wearer.wrist,
      intentions: d.intentions,
      focus: d.focus ?? null,
      is_gift: d.isGift,
      gift_note: d.giftNote ?? null,
      delivery_name: d.contact.deliveryName,
      mobile: d.contact.mobile,
      email: d.contact.email ?? null,
      address_line1: d.address.line1,
      address_line2: d.address.line2 ?? null,
      landmark: d.address.landmark ?? null,
      city: d.address.city,
      state: d.address.state,
      pincode: d.address.pincode,
      marketing_opt_in: d.marketing,
      terms_accepted_at: new Date().toISOString(),
      utm: d.utm ?? {},
      razorpay_order_id: order.id,
      coupon_code: couponCode,
      discount_paise: discountInr * 100,
      purposes: purposeSlugs,
      partner_code: partner?.code ?? null,
      partner_kind: partner?.kind ?? null,
      partner_rate: partner?.rate ?? null,
      commission_paise: partner?.commissionPaise ?? 0,
      order_source: d.source ?? "reading",
    }).catch((e) => console.error("[checkout] db insert failed", e instanceof Error ? e.message : e));

    return NextResponse.json({ orderId: order.id, keyId: razorpayKeyId(), amount: amountPaise, currency: "INR", ref });
  } catch (e) {
    console.error("[checkout] create failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: M.startFailed }, { status: 502 });
  }
}
