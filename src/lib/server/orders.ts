import "server-only";

// Order store. Uses the Supabase REST API with the service-role key when
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set. Without them, the Razorpay
// order itself (with its notes) is the record, so checkout still works.

const URL_ = process.env.SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const dbConfigured = () => !!(URL_ && KEY);

const headers = () => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
});

export type OrderRecord = {
  ref: string;
  status: "pending" | "paid" | "failed";
  bracelet_slug: string;
  bracelet_title: string;
  amount_paise: number;
  wearer_first_name: string;
  wearer_last_name: string;
  wearer_dob: string; // YYYY-MM-DD
  wearer_gender: string;
  mulank: number;
  bhagyank: number;
  wrist: string;
  intentions: string[];
  focus: string | null;
  is_gift: boolean;
  gift_note: string | null;
  delivery_name: string;
  mobile: string;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  marketing_opt_in: boolean;
  terms_accepted_at: string;
  utm: Record<string, string>;
  razorpay_order_id: string;
};

export async function insertOrder(o: OrderRecord) {
  if (!dbConfigured()) return;
  const res = await fetch(`${URL_}/rest/v1/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(o),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`orders insert failed: ${res.status}`);
}

/** Idempotent: only moves pending/failed → paid. */
export async function markPaid(razorpayOrderId: string, paymentId: string, method?: string) {
  if (!dbConfigured()) return;
  const q = `razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&status=neq.paid`;
  const res = await fetch(`${URL_}/rest/v1/orders?${q}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status: "paid", razorpay_payment_id: paymentId, payment_method: method ?? null, paid_at: new Date().toISOString() }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`orders update failed: ${res.status}`);
}

export async function markFailed(razorpayOrderId: string) {
  if (!dbConfigured()) return;
  const q = `razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&status=eq.pending`;
  await fetch(`${URL_}/rest/v1/orders?${q}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status: "failed" }),
    signal: AbortSignal.timeout(8_000),
  });
}
