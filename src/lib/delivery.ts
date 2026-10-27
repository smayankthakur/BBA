const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** e.g. "Thu 29 Oct – Sat 31 Oct" for an order placed today. */
export function deliveryWindow(minDays: number, maxDays: number, from = new Date()) {
  const a = new Date(from);
  a.setDate(a.getDate() + minDays);
  const b = new Date(from);
  b.setDate(b.getDate() + maxDays);
  return `${fmt(a)} – ${fmt(b)}`;
}
