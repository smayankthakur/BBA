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
  coupon_code?: string | null;
  discount_paise?: number;
  purposes?: string[];
  upgrade_paise?: number;
  partner_code?: string | null;
  partner_kind?: string | null;
  partner_rate?: number | null;
  commission_paise?: number;
  /** "quick" orders add gender/focus/note after payment */
  order_source?: string;
  details_at?: string | Date | null;
  wearer_note?: string | null;
};

export async function insertOrder(o: OrderRecord) {
  if (!dbConfigured()) return;
  await ensureSchema();
  await sql`insert into orders (
      ref, status, bracelet_slug, bracelet_title, amount_paise,
      wearer_first_name, wearer_last_name, wearer_dob, wearer_gender, mulank, bhagyank, wrist,
      intentions, focus, is_gift, gift_note, delivery_name, mobile, email,
      address_line1, address_line2, landmark, city, state, pincode,
      marketing_opt_in, terms_accepted_at, utm, razorpay_order_id, coupon_code, discount_paise,
      purposes, partner_code, partner_kind, partner_rate, commission_paise, order_source
    ) values (
      ${o.ref}, ${o.status}, ${o.bracelet_slug}, ${o.bracelet_title}, ${o.amount_paise},
      ${o.wearer_first_name}, ${o.wearer_last_name}, ${o.wearer_dob}, ${o.wearer_gender}, ${o.mulank}, ${o.bhagyank}, ${o.wrist},
      ${o.intentions}, ${o.focus}, ${o.is_gift}, ${o.gift_note}, ${o.delivery_name}, ${o.mobile}, ${o.email},
      ${o.address_line1}, ${o.address_line2}, ${o.landmark}, ${o.city}, ${o.state}, ${o.pincode},
      ${o.marketing_opt_in}, ${o.terms_accepted_at}, ${JSON.stringify(o.utm)}::jsonb, ${o.razorpay_order_id},
      ${o.coupon_code ?? null}, ${o.discount_paise ?? 0},
      ${o.purposes ?? [o.bracelet_slug]}, ${o.partner_code ?? null}, ${o.partner_kind ?? null}, ${o.partner_rate ?? null}, ${o.commission_paise ?? 0}, ${o.order_source ?? "reading"}
    ) on conflict (razorpay_order_id) do nothing`;
}

/**
 * Idempotent: only moves pending/failed → paid. Works for both a first
 * payment and a top-up (extra purposes after payment). Returns the Razorpay
 * order id of the main order, whose staff sheet should go out.
 */
export async function markPaid(razorpayOrderId: string, paymentId: string, method?: string): Promise<string> {
  if (!dbConfigured()) return razorpayOrderId;
  await ensureSchema();
  const main = await sql<{ id: string }>`select id from orders where razorpay_order_id = ${razorpayOrderId}`;
  if (main.length) {
    await sql`update orders
      set status = 'paid', razorpay_payment_id = ${paymentId}, payment_method = ${method ?? null}, paid_at = now()
      where razorpay_order_id = ${razorpayOrderId} and status <> 'paid'`;
    return razorpayOrderId;
  }
  return (await markUpgradePaid(razorpayOrderId, paymentId)) ?? razorpayOrderId;
}

/* ---------------- Top-ups: extra purposes after payment ---------------- */

export type UpgradeRow = {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  add_slugs: string[];
  add_titles: string[];
  amount_paise: number;
  status: "pending" | "paid" | "failed";
  created_at: string | Date;
  paid_at: string | Date | null;
};

/** The paid order a top-up is for, looked up by its Razorpay order id. */
export async function paidOrderForUpgrade(razorpayOrderId: string) {
  if (!dbConfigured()) return null;
  await ensureSchema();
  const rows = await sql<{ id: string; ref: string; bracelet_slug: string; purposes: string[]; fulfilment_status: string; mobile: string; delivery_name: string; email: string | null }>`
    select id, ref, bracelet_slug, purposes, fulfilment_status, mobile, delivery_name, email
    from orders where razorpay_order_id = ${razorpayOrderId} and status = 'paid'`;
  return rows[0] ?? null;
}

export async function insertUpgrade(u: { orderId: string; razorpayOrderId: string; addSlugs: string[]; addTitles: string[]; amountPaise: number }) {
  await sql`insert into order_upgrades (order_id, razorpay_order_id, add_slugs, add_titles, amount_paise)
    values (${u.orderId}, ${u.razorpayOrderId}, ${u.addSlugs}, ${u.addTitles}, ${u.amountPaise})`;
}

/** Applies a paid top-up to its order once. Returns the main order's Razorpay id. */
async function markUpgradePaid(razorpayOrderId: string, paymentId: string): Promise<string | null> {
  const up = await sql<UpgradeRow>`update order_upgrades set status = 'paid', razorpay_payment_id = ${paymentId}, paid_at = now()
    where razorpay_order_id = ${razorpayOrderId} and status <> 'paid' returning *`;
  if (!up.length) {
    const done = await sql<{ rid: string }>`select o.razorpay_order_id as rid from order_upgrades u join orders o on o.id = u.order_id
      where u.razorpay_order_id = ${razorpayOrderId}`;
    return done[0]?.rid ?? null;
  }
  const u = up[0];
  const rows = await sql<{ rid: string }>`update orders set
      purposes = purposes || ${u.add_slugs},
      bracelet_title = bracelet_title || ' + ' || ${u.add_titles.join(" + ")},
      upgrade_paise = upgrade_paise + ${u.amount_paise},
      commission_paise = commission_paise + case when partner_kind = 'percent' then floor(${u.amount_paise} * coalesce(partner_rate, 0) / 100.0) :: int else 0 end,
      staff_notified_at = null,
      updated_at = now()
    where id = ${u.order_id} returning razorpay_order_id as rid`;
  return rows[0]?.rid ?? null;
}

export async function upgradesFor(orderId: string) {
  await ensureSchema();
  return sql<UpgradeRow>`select * from order_upgrades where order_id = ${orderId} order by created_at`;
}

export async function markUpgradeFailed(razorpayOrderId: string) {
  await sql`update order_upgrades set status = 'failed' where razorpay_order_id = ${razorpayOrderId} and status = 'pending'`;
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
  await markUpgradeFailed(razorpayOrderId);
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
  const rows = await sql<{ amount_paise: number }>`select amount_paise from orders where razorpay_order_id = ${razorpayOrderId}
    union all select amount_paise from order_upgrades where razorpay_order_id = ${razorpayOrderId}`;
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
      coalesce(sum(amount_paise + upgrade_paise) filter (where status = 'paid'), 0) :: int as revenue,
      count(*) filter (where status = 'paid' and paid_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata') :: int as today,
      count(*) filter (where status = 'paid' and fulfilment_status in ('new', 'reading', 'making')) :: int as to_ship
    from orders`;
  return rows[0];
}

/* ---------------- Quick order: details added after payment ---------------- */

/**
 * Saves what the customer adds after paying (gender, focus, a note for Ammit).
 * Only for a paid order that hasn't gone into making yet. Returns the order
 * (for the staff email) or null.
 */
export async function saveOrderDetails(
  razorpayOrderId: string,
  d: { gender?: string; focus?: string; note?: string },
): Promise<StoredOrder | null> {
  if (!dbConfigured()) return null;
  await ensureSchema();
  const rows = (await sql`update orders set
      wearer_gender = coalesce(${d.gender ?? null}, wearer_gender),
      focus = coalesce(${d.focus ?? null}, focus),
      wearer_note = coalesce(${d.note ?? null}, wearer_note),
      details_at = now(), updated_at = now()
    where razorpay_order_id = ${razorpayOrderId} and status = 'paid'
      and fulfilment_status in ('new', 'reading')
      and paid_at > now() - interval '14 days'
    returning *, to_char(wearer_dob, 'YYYY-MM-DD') as dob_text`) as StoredOrder[];
  return rows[0] ?? null;
}
