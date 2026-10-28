/**
 * Prices by number of purposes in one bracelet (client, 28 Oct 2026):
 * 1 purpose ₹1,200 · 2 purposes ₹1,900 · 3 purposes ₹3,000.
 * Only the 1-purpose price is shown upfront; the rest is offered at checkout
 * and after payment. A bracelet with its own price keeps the same step-ups.
 */
export type Tiers = [number, number, number];
export const MAX_PURPOSES = 3;

export function priceFor(basePriceInr: number, purposes: number, tiers: Tiers) {
  const n = Math.max(1, Math.min(MAX_PURPOSES, Math.round(purposes)));
  return basePriceInr + (tiers[n - 1] - tiers[0]);
}

/** What adding purposes costs on top of what was already paid. */
export const extraFor = (basePriceInr: number, from: number, to: number, tiers: Tiers) =>
  priceFor(basePriceInr, to, tiers) - priceFor(basePriceInr, from, tiers);
