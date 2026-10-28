import { NextResponse } from "next/server";
import { langOfRequest } from "@/lib/server/lang";
import { uiFor } from "@/lib/i18n/ui";
import { DetailsSchema } from "@/lib/checkoutSchema";
import { saveOrderDetails } from "@/lib/server/orders";
import { notifyStaffOfDetails } from "@/lib/server/staffNotify";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * After paying for a quick order, the customer can add the wearer's gender,
 * what they want help with and a note for Ammit. Identified by the paid
 * order's Razorpay order id, which only the buyer's browser has.
 */
export async function POST(req: Request) {
  const Q = uiFor(langOfRequest(req)).server;
  if (rateLimited(`details:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: Q.tooMany }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 4096) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let parsed;
  try {
    parsed = DetailsSchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: Q.checkDetails }, { status: 400 });
  const { orderId, gender, focus, note, lang } = parsed.data;
  const M = uiFor(lang ?? "en").server;
  const order = await saveOrderDetails(orderId, { gender, focus, note }).catch((e) => {
    console.error("[details] save failed", e instanceof Error ? e.message : e);
    return null;
  });
  if (!order) return NextResponse.json({ error: M.detailsFailed }, { status: 400 });
  await notifyStaffOfDetails(order).catch((e) => console.error("[details] staff email failed", e instanceof Error ? e.message : e));
  return NextResponse.json({ ok: true });
}
