import "server-only";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";
import { COUPON_RE, couponState, discountFor, normCode, type Coupon } from "@/lib/coupon-types";

type Row = {
  id: string;
  code: string;
  description: string;
  kind: "percent" | "flat";
  value: number;
  max_discount_inr: number | null;
  min_order_inr: number;
  starts_at: string | Date | null;
  ends_at: string | Date | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  products: string[];
  active: boolean;
  created_at: string | Date;
  used: number;
  discount_given: number;
};

const iso = (d: string | Date | null) => (d ? new Date(d).toISOString() : null);
const fromRow = (r: Row): Coupon => ({
  id: r.id,
  code: r.code,
  description: r.description,
  kind: r.kind,
  value: r.value,
  maxDiscountInr: r.max_discount_inr,
  minOrderInr: r.min_order_inr,
  startsAt: iso(r.starts_at),
  endsAt: iso(r.ends_at),
  usageLimit: r.usage_limit,
  perCustomerLimit: r.per_customer_limit,
  products: r.products ?? [],
  active: r.active,
  createdAt: iso(r.created_at)!,
  used: r.used ?? 0,
  discountGivenInr: Math.round((r.discount_given ?? 0) / 100),
});

/** Coupons with how many paid orders used each one. */
async function select(where: { id?: string; code?: string }) {
  await ensureSchema();
  const rows = await sql<Row>`select c.*,
      coalesce(u.used, 0) :: int as used, coalesce(u.discount_given, 0) :: int as discount_given
    from coupons c
    left join (
      select coupon_code, count(*) as used, sum(discount_paise) as discount_given
      from orders where status = 'paid' and coupon_code is not null group by coupon_code
    ) u on u.coupon_code = c.code
    where (${where.id ?? ""} = '' or c.id :: text = ${where.id ?? ""})
      and (${where.code ?? ""} = '' or c.code = ${where.code ?? ""})
    order by c.created_at desc`;
  return rows.map(fromRow);
}

export const listCoupons = () => select({});
export async function getCoupon(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return (await select({ id }))[0] ?? null;
}

export type CouponInput = Omit<Coupon, "id" | "createdAt" | "used" | "discountGivenInr">;

export async function codeTaken(code: string, exceptId?: string) {
  await ensureSchema();
  const rows = await sql<{ id: string }>`select id from coupons where code = ${code}`;
  return rows.some((r) => r.id !== exceptId);
}

export async function saveCoupon(id: string | null, c: CouponInput, userId: string) {
  await ensureSchema();
  if (id) {
    await sql`update coupons set code = ${c.code}, description = ${c.description}, kind = ${c.kind}, value = ${c.value},
      max_discount_inr = ${c.maxDiscountInr}, min_order_inr = ${c.minOrderInr}, starts_at = ${c.startsAt}, ends_at = ${c.endsAt},
      usage_limit = ${c.usageLimit}, per_customer_limit = ${c.perCustomerLimit}, products = ${c.products}, active = ${c.active},
      updated_at = now() where id = ${id}`;
    return id;
  }
  const rows = await sql<{ id: string }>`insert into coupons (code, description, kind, value, max_discount_inr, min_order_inr,
      starts_at, ends_at, usage_limit, per_customer_limit, products, active, created_by)
    values (${c.code}, ${c.description}, ${c.kind}, ${c.value}, ${c.maxDiscountInr}, ${c.minOrderInr}, ${c.startsAt}, ${c.endsAt},
      ${c.usageLimit}, ${c.perCustomerLimit}, ${c.products}, ${c.active}, ${userId})
    on conflict (code) do nothing returning id`;
  return rows[0]?.id ?? null;
}

export async function setCouponActive(id: string, active: boolean) {
  await sql`update coupons set active = ${active}, updated_at = now() where id = ${id}`;
}

/** Orders that used a deleted coupon keep its code and discount. */
export async function deleteCoupon(id: string) {
  await sql`delete from coupons where id = ${id}`;
}

/* ------------------------------------------------------------------ */
/* Checkout                                                             */
/* ------------------------------------------------------------------ */

export type CouponCheck =
  | { ok: true; code: string; discountInr: number; totalInr: number; label: string }
  | { ok: false; error: string };

/**
 * Decides whether a code applies to this bracelet (and customer) and what it
 * takes off. Used both to preview the discount and, again, when the payment
 * is created, so the browser can never set its own price.
 */
export async function checkCoupon(rawCode: string, product: { slug: string; title: string; priceInr: number }, mobile?: string): Promise<CouponCheck> {
  const code = normCode(rawCode);
  const nope = "That coupon code isn't valid.";
  if (!COUPON_RE.test(code)) return { ok: false, error: nope };
  if (!dbConfigured()) return { ok: false, error: "Coupons aren't available right now." };
  const c = (await select({ code }))[0];
  if (!c) return { ok: false, error: nope };

  const state = couponState(c);
  if (state === "off") return { ok: false, error: nope };
  if (state === "scheduled") return { ok: false, error: "That coupon isn't active yet." };
  if (state === "expired") return { ok: false, error: "That coupon has expired." };
  if (state === "used-up") return { ok: false, error: "That coupon has been fully used." };
  if (c.products.length && !c.products.includes(product.slug)) return { ok: false, error: `That coupon doesn't apply to the ${product.title} bracelet.` };
  if (product.priceInr < c.minOrderInr) return { ok: false, error: `That coupon needs an order of at least ₹${c.minOrderInr.toLocaleString("en-IN")}.` };
  if (c.perCustomerLimit != null && mobile) {
    const rows = await sql<{ n: number }>`select count(*) :: int as n from orders
      where coupon_code = ${code} and status = 'paid' and mobile = ${mobile}`;
    if ((rows[0]?.n ?? 0) >= c.perCustomerLimit) return { ok: false, error: "You've already used this coupon." };
  }
  const discountInr = discountFor(c, product.priceInr);
  if (discountInr <= 0) return { ok: false, error: nope };
  return { ok: true, code, discountInr, totalInr: product.priceInr - discountInr, label: c.description || "" };
}
