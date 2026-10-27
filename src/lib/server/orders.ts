import "server-only";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";

// Order store on Postgres (Neon via the Vercel integration, which sets
// DATABASE_URL). All queries are parameterised. Without DATABASE_URL the
// Razorpay order itself (with its notes) is the record, so checkout still works.

export { dbConfigured };

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
  await ensureSchema();
  await sql`insert into orders (
      ref, status, bracelet_slug, bracelet_title, amount_paise,
      wearer_first_name, wearer_last_name, wearer_dob, wearer_gender, mulank, bhagyank, wrist,
      intentions, focus, is_gift, gift_note, delivery_name, mobile, email,
      address_line1, address_line2, landmark, city, state, pincode,
      marketing_opt_in, terms_accepted_at, utm, razorpay_order_id
    ) values (
      ${o.ref}, ${o.status}, ${o.bracelet_slug}, ${o.bracelet_title}, ${o.amount_paise},
      ${o.wearer_first_name}, ${o.wearer_last_name}, ${o.wearer_dob}, ${o.wearer_gender}, ${o.mulank}, ${o.bhagyank}, ${o.wrist},
      ${o.intentions}, ${o.focus}, ${o.is_gift}, ${o.gift_note}, ${o.delivery_name}, ${o.mobile}, ${o.email},
      ${o.address_line1}, ${o.address_line2}, ${o.landmark}, ${o.city}, ${o.state}, ${o.pincode},
      ${o.marketing_opt_in}, ${o.terms_accepted_at}, ${JSON.stringify(o.utm)}::jsonb, ${o.razorpay_order_id}
    ) on conflict (razorpay_order_id) do nothing`;
}

/** Idempotent: only moves pending/failed → paid. */
export async function markPaid(razorpayOrderId: string, paymentId: string, method?: string) {
  if (!dbConfigured()) return;
  await ensureSchema();
  await sql`update orders
    set status = 'paid', razorpay_payment_id = ${paymentId}, payment_method = ${method ?? null}, paid_at = now()
    where razorpay_order_id = ${razorpayOrderId} and status <> 'paid'`;
}

export type StoredOrder = Omit<OrderRecord, "wearer_dob" | "terms_accepted_at"> & {
  dob_text: string; // YYYY-MM-DD
  terms_accepted_at: string | Date;
  razorpay_payment_id: string | null;
  payment_method: string | null;
  paid_at: string | Date | null;
  created_at: string | Date;
};

/**
 * Claims a paid order for the staff email, once. Returns the order if this
 * caller should send it, or null if it was already sent (or isn't paid).
 */
export async function claimStaffNotification(razorpayOrderId: string): Promise<StoredOrder | null> {
  if (!dbConfigured()) return null;
  await ensureSchema();
  const rows = (await sql`update orders set staff_notified_at = now()
    where razorpay_order_id = ${razorpayOrderId} and status = 'paid' and staff_notified_at is null
    returning *, to_char(wearer_dob, 'YYYY-MM-DD') as dob_text`) as StoredOrder[];
  return rows[0] ?? null;
}

/** Lets a later attempt (e.g. the webhook) resend if the email failed. */
export async function releaseStaffNotification(razorpayOrderId: string) {
  if (!dbConfigured()) return;
  await sql`update orders set staff_notified_at = null where razorpay_order_id = ${razorpayOrderId}`;
}

export async function markFailed(razorpayOrderId: string) {
  if (!dbConfigured()) return;
  await ensureSchema();
  await sql`update orders set status = 'failed' where razorpay_order_id = ${razorpayOrderId} and status = 'pending'`;
}

/** For the health check: confirms the connection and the table exist. */
export async function dbHealth() {
  await ensureSchema();
  await sql`select 1 from orders limit 1`;
}

/** Amount (paise) recorded for a Razorpay order, or null if unknown. */
export async function orderAmount(razorpayOrderId: string): Promise<number | null> {
  if (!dbConfigured()) return null;
  await ensureSchema();
  const rows = await sql<{ amount_paise: number }>`select amount_paise from orders where razorpay_order_id = ${razorpayOrderId}`;
  return rows[0]?.amount_paise ?? null;
}

/* ---------------- Admin ---------------- */

export type AdminOrder = StoredOrder & {
  id: string;
  status: "pending" | "paid" | "failed";
  fulfilment_status: string;
  courier: string | null;
  tracking_number: string | null;
  admin_notes: string | null;
  updated_at: string | Date | null;
};

export const FULFILMENT = ["new", "reading", "making", "shipped", "delivered", "cancelled"] as const;
export type Fulfilment = (typeof FULFILMENT)[number];

export async function listOrders(opts: { status?: string; fulfilment?: string; q?: string; limit?: number; offset?: number }) {
  await ensureSchema();
  const q = (opts.q ?? "").trim();
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const rows = await sql<AdminOrder & { total: number }>`
    select *, to_char(wearer_dob, 'YYYY-MM-DD') as dob_text, count(*) over() :: int as total
    from orders
    where (${opts.status ?? ""} = '' or status = ${opts.status ?? ""})
      and (${opts.fulfilment ?? ""} = '' or fulfilment_status = ${opts.fulfilment ?? ""})
      and (${q} = '' or ref ilike ${like} or wearer_first_name ilike ${like} or wearer_last_name ilike ${like}
           or delivery_name ilike ${like} or mobile ilike ${like} or coalesce(email, '') ilike ${like} or pincode ilike ${like})
    order by created_at desc
    limit ${opts.limit ?? 50} offset ${opts.offset ?? 0}`;
  return { rows, total: rows[0]?.total ?? 0 };
}

export async function getOrder(id: string) {
  await ensureSchema();
  const rows = await sql<AdminOrder>`select *, to_char(wearer_dob, 'YYYY-MM-DD') as dob_text from orders where id = ${id}`;
  return rows[0] ?? null;
}

export async function updateOrderAdmin(
  id: string,
  f: { fulfilment_status: Fulfilment; courier: string | null; tracking_number: string | null; admin_notes: string | null },
) {
  await ensureSchema();
  await sql`update orders set fulfilment_status = ${f.fulfilment_status}, courier = ${f.courier},
    tracking_number = ${f.tracking_number}, admin_notes = ${f.admin_notes}, updated_at = now() where id = ${id}`;
}

export async function orderStats() {
  await ensureSchema();
  const rows = await sql<{
    paid: number; pending: number; failed: number; revenue: number; today: number; to_ship: number;
  }>`select
      count(*) filter (where status = 'paid') :: int as paid,
      count(*) filter (where status = 'pending') :: int as pending,
      count(*) filter (where status = 'failed') :: int as failed,
      coalesce(sum(amount_paise) filter (where status = 'paid'), 0) :: int as revenue,
      count(*) filter (where status = 'paid' and paid_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata') :: int as today,
      count(*) filter (where status = 'paid' and fulfilment_status in ('new', 'reading', 'making')) :: int as to_ship
    from orders`;
  return rows[0];
}
