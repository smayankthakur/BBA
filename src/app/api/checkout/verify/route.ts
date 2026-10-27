import { NextResponse } from "next/server";
import { VerifySchema } from "@/lib/checkoutSchema";
import { fetchPayment, razorpayConfigured, verifyPaymentSignature } from "@/lib/server/razorpay";
import { markPaid, orderAmount } from "@/lib/server/orders";
import { notifyStaffOfPaidOrder } from "@/lib/server/staffNotify";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";
import { fetchOrderAmount } from "@/lib/server/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!razorpayConfigured()) return NextResponse.json({ error: "Online payment is being switched on. Please try again in a little while." }, { status: 503 });
  if (rateLimited(`verify:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }
  const raw = await req.text();
  if (raw.length > 2048) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // 1) Signature from Razorpay Checkout must match our secret.
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }
  // 2) Double-check the payment with Razorpay: right order, right amount, captured/authorized.
  try {
    const p = await fetchPayment(razorpay_payment_id);
    const okStatus = p.status === "captured" || p.status === "authorized";
    // The amount must match what our server set when it created this order.
    const expected = (await orderAmount(razorpay_order_id).catch(() => null)) ?? (await fetchOrderAmount(razorpay_order_id));
    if (p.order_id !== razorpay_order_id || !expected || p.amount !== expected || p.currency !== "INR" || !okStatus) {
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
    }
    await markPaid(razorpay_order_id, razorpay_payment_id, p.method).catch((e) =>
      console.error("[checkout] db update failed", e instanceof Error ? e.message : e),
    );
    await notifyStaffOfPaidOrder(razorpay_order_id).catch((e) =>
      console.error("[checkout] staff email failed", e instanceof Error ? e.message : e),
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[checkout] verify failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "We couldn't confirm the payment yet. If money was taken, it will be confirmed shortly." }, { status: 502 });
  }
}
