import { apiAdmin } from "@/lib/server/adminApi";
import { logAction } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { ensureSchema } from "@/lib/server/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Marketing list: one row per customer (mobile number) who paid and ticked
 * "Send me … offers on WhatsApp" on their latest order. Nobody else is
 * included. Admins and owner only.
 */
export async function GET(req: Request) {
  const user = await apiAdmin(req, "admin", false);
  if (user instanceof Response) return user;
  await ensureSchema();
  const rows = await sql<{
    name: string; mobile: string; email: string | null; city: string; state: string; orders: number; spent: number; purposes: string; first_at: Date; last_at: Date; lang: string | null;
  }>`
    with latest as (
      select distinct on (mobile) mobile, delivery_name, email, city, state, marketing_opt_in, lang
      from orders where status = 'paid' order by mobile, paid_at desc nulls last
    )
    select l.delivery_name as name, l.mobile, l.email, l.city, l.state, l.lang,
           count(o.*)::int as orders, sum(o.amount_paise + o.upgrade_paise)::int as spent,
           string_agg(distinct o.bracelet_title, '; ') as purposes, min(o.paid_at) as first_at, max(o.paid_at) as last_at
    from latest l join orders o on o.mobile = l.mobile and o.status = 'paid'
    where l.marketing_opt_in
    group by l.mobile, l.delivery_name, l.email, l.city, l.state, l.lang
    order by max(o.paid_at) desc`;
  const cols: [string, (r: (typeof rows)[number]) => unknown][] = [
    ["Name", (r) => r.name],
    ["Mobile", (r) => `91${r.mobile}`],
    ["Email", (r) => r.email],
    ["City", (r) => r.city],
    ["State", (r) => r.state],
    ["Language", (r) => ({ hi: "Hindi", hn: "Hinglish" })[r.lang ?? ""] ?? "English"],
    ["Paid orders", (r) => r.orders],
    ["Spent (Rs)", (r) => r.spent / 100],
    ["Bought", (r) => r.purposes],
    ["First order", (r) => new Date(r.first_at).toISOString().slice(0, 10)],
    ["Last order", (r) => new Date(r.last_at).toISOString().slice(0, 10)],
  ];
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.map(([h]) => cell(h)).join(","), ...rows.map((r) => cols.map(([, f]) => cell(f(r))).join(","))].join("\r\n");
  await logAction(user.id, "customers.export", String(rows.length));
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bba-marketing-list-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
