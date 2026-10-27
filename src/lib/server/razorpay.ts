import "server-only";
import crypto from "node:crypto";

// Razorpay REST helpers (no SDK). Keys come from environment variables only.
// RAZORPAY_API_BASE exists so tests can point at a local mock.

const BASE = process.env.RAZORPAY_API_BASE ?? "https://api.razorpay.com";
const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

export const razorpayConfigured = () => !!(KEY_ID && KEY_SECRET);
export const razorpayKeyId = () => KEY_ID;

const auth = () => "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: auth(), "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export type RzpOrder = { id: string; amount: number; currency: string; receipt: string; status: string };
export type RzpPayment = { id: string; order_id: string; amount: number; currency: string; status: string; method?: string };

export function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  return call<RzpOrder>("/v1/orders", {
    method: "POST",
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });
}

export function fetchPayment(paymentId: string) {
  return call<RzpPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

/** Amount (paise) on a Razorpay order, as Razorpay recorded it when we created it. */
export async function fetchOrderAmount(orderId: string): Promise<number | null> {
  try {
    const o = await call<RzpOrder>(`/v1/orders/${encodeURIComponent(orderId)}`);
    return typeof o.amount === "number" ? o.amount : null;
  } catch {
    return null;
  }
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Checkout callback signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!KEY_SECRET) return false;
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
