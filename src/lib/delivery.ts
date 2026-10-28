/** e.g. "Thu 29 Oct – Sat 31 Oct" for an order placed today (in the visitor's language). */
export function deliveryWindow(minDays: number, maxDays: number, from = new Date(), locale = "en-IN") {
  const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  const a = new Date(from);
  a.setDate(a.getDate() + minDays);
  const b = new Date(from);
  b.setDate(b.getDate() + maxDays);
  return `${fmt(a)} – ${fmt(b)}`;
}
