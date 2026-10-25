import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Order store on Postgres (Neon via the Vercel integration, which sets
// DATABASE_URL). All queries are parameterised. Without DATABASE_URL the
// Razorpay order itself (with its notes) is the record, so checkout still works.

const URL_ = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
export const dbConfigured = () => !!URL_;

let sqlFn: NeonQueryFunction<false, false> | null = null;
const db = () => (sqlFn ??= neon(URL_));

let schemaReady: Promise<void> | null = null;
/** Creates the table on first use (idempotent), once per server instance. */
export function ensureSchema() {
  schemaReady ??= (async () => {
    const sql = db();
    await sql`create table if not exists orders (
      id uuid primary key default gen_random_uuid(),
      ref text not null unique,
      status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
      bracelet_slug text not null,
      bracelet_title text not null,
      amount_paise integer not null check (amount_paise > 0),
      wearer_first_name text not null,
      wearer_last_name text not null default '',
      wearer_dob date not null,
      wearer_gender text not null,
      mulank smallint not null,
      bhagyank smallint not null,
      wrist text not null,
      intentions text[] not null default '{}',
      focus text,
      is_gift boolean not null default false,
      gift_note text,
      delivery_name text not null,
      mobile text not null,
      email text,
      address_line1 text not null,
      address_line2 text,
      landmark text,
      city text not null,
      state text not null,
      pincode text not null,
      marketing_opt_in boolean not null default false,
      terms_accepted_at timestamptz not null,
      utm jsonb not null default '{}'::jsonb,
      razorpay_order_id text not null unique,
      razorpay_payment_id text,
      payment_method text,
      paid_at timestamptz,
      created_at timestamptz not null default now()
    )`;
    await sql`create index if not exists orders_status_created_idx on orders (status, created_at desc)`;
    await sql`alter table orders add column if not exists staff_notified_at timestamptz`;
  })().catch((e) => {
    schemaReady = null; // retry next time
    throw e;
  });
  return schemaReady;
}

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
  await db()`insert into orders (
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
  await db()`update orders
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
  const rows = (await db()`update orders set staff_notified_at = now()
    where razorpay_order_id = ${razorpayOrderId} and status = 'paid' and staff_notified_at is null
    returning *, to_char(wearer_dob, 'YYYY-MM-DD') as dob_text`) as StoredOrder[];
  return rows[0] ?? null;
}

/** Lets a later attempt (e.g. the webhook) resend if the email failed. */
export async function releaseStaffNotification(razorpayOrderId: string) {
  if (!dbConfigured()) return;
  await db()`update orders set staff_notified_at = null where razorpay_order_id = ${razorpayOrderId}`;
}

export async function markFailed(razorpayOrderId: string) {
  if (!dbConfigured()) return;
  await ensureSchema();
  await db()`update orders set status = 'failed' where razorpay_order_id = ${razorpayOrderId} and status = 'pending'`;
}

/** For the health check: confirms the connection and the table exist. */
export async function dbHealth() {
  await ensureSchema();
  await db()`select 1 from orders limit 1`;
}
