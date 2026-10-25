import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { markFailed, markPaid } from "@/lib/server/orders";
import { notifyStaffOfPaidOrder } from "@/lib/server/staffNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook (set in Dashboard → Webhooks, events: order.paid,
 * payment.captured, payment.failed). Verifies the HMAC on the raw body and
 * updates the order idempotently, so retries are safe.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 64 * 1024) return NextResponse.json({ ok: false }, { status: 413 });
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; method?: string } } } };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const p = evt.payload?.payment?.entity;
  try {
    if ((evt.event === "order.paid" || evt.event === "payment.captured") && p?.order_id && p.id) {
      await markPaid(p.order_id, p.id, p.method);
      await notifyStaffOfPaidOrder(p.order_id).catch((e) =>
        console.error("[webhook] staff email failed", e instanceof Error ? e.message : e),
      );
    } else if (evt.event === "payment.failed" && p?.order_id) {
      await markFailed(p.order_id);
    }
  } catch (e) {
    console.error("[webhook] update failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 500 }); // Razorpay will retry
  }
  return NextResponse.json({ ok: true });
}
