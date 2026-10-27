/** Coupon shapes shared by the server and the admin panel. */
export type Coupon = {
  id: string;
  code: string;
  description: string;
  kind: "percent" | "flat";
  /** percent: 1–90; flat: rupees */
  value: number;
  /** percent only: most it can take off, in rupees */
  maxDiscountInr: number | null;
  minOrderInr: number;
  startsAt: string | null;
  endsAt: string | null;
  /** total paid orders allowed */
  usageLimit: number | null;
  /** paid orders allowed per mobile number */
  perCustomerLimit: number | null;
  /** bracelet slugs; empty = every bracelet */
  products: string[];
  active: boolean;
  createdAt: string;
  /** paid orders that used it */
  used: number;
  /** total discount given on paid orders, rupees */
  discountGivenInr: number;
};

export const COUPON_RE = /^[A-Z0-9][A-Z0-9_-]{2,23}$/;
export const normCode = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

export function couponLabel(c: Pick<Coupon, "kind" | "value" | "maxDiscountInr">) {
  if (c.kind === "flat") return `₹${c.value.toLocaleString("en-IN")} off`;
  return `${c.value}% off${c.maxDiscountInr ? ` (up to ₹${c.maxDiscountInr.toLocaleString("en-IN")})` : ""}`;
}

/** Discount in rupees for a price, never leaving less than ₹1 to pay. */
export function discountFor(c: Pick<Coupon, "kind" | "value" | "maxDiscountInr">, priceInr: number) {
  let d = c.kind === "flat" ? c.value : Math.floor((priceInr * c.value) / 100);
  if (c.kind === "percent" && c.maxDiscountInr) d = Math.min(d, c.maxDiscountInr);
  return Math.max(0, Math.min(d, priceInr - 1));
}

export type CouponState = "active" | "scheduled" | "expired" | "used-up" | "off";
export function couponState(c: Coupon, now = new Date()): CouponState {
  if (!c.active) return "off";
  if (c.startsAt && new Date(c.startsAt) > now) return "scheduled";
  if (c.endsAt && new Date(c.endsAt) < now) return "expired";
  if (c.usageLimit != null && c.used >= c.usageLimit) return "used-up";
  return "active";
}
