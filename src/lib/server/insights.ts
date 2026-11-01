import "server-only";
import { sql } from "./db";
import { ensureSchema } from "./schema";

/** Numbers for the dashboard, for the last `days` days (0 = all time). India time. */
export async function insights(days: number) {
  await ensureSchema();
  const since = days > 0 ? new Date(Date.now() - days * 86_400_000).toISOString() : "1970-01-01T00:00:00Z";
  const [byPurpose, partners, coupons, abandoned, totals] = await Promise.all([
    // Each purpose in a paid bracelet counts once; revenue goes to the main purpose.
    sql<{ slug: string; orders: number; main: number; revenue: number }>`
      with p as (
        select o.id, o.bracelet_slug, o.amount_paise + o.upgrade_paise as total,
               unnest(case when cardinality(o.purposes) > 0 then o.purposes else array[o.bracelet_slug] end) as slug
        from orders o where o.status = 'paid' and o.paid_at >= ${since}
      )
      select slug, count(*)::int as orders,
             count(*) filter (where slug = bracelet_slug)::int as main,
             coalesce(sum(total) filter (where slug = bracelet_slug), 0)::int as revenue
      from p group by slug order by orders desc`,
    sql<{ code: string; orders: number; revenue: number; commission: number }>`
      select partner_code as code, count(*)::int as orders, sum(amount_paise + upgrade_paise)::int as revenue, sum(commission_paise)::int as commission
      from orders where status = 'paid' and partner_code is not null and paid_at >= ${since}
      group by partner_code order by revenue desc limit 10`,
    sql<{ code: string; orders: number; discount: number; revenue: number }>`
      select coupon_code as code, count(*)::int as orders, sum(discount_paise)::int as discount, sum(amount_paise + upgrade_paise)::int as revenue
      from orders where status = 'paid' and coupon_code is not null and paid_at >= ${since}
      group by coupon_code order by orders desc limit 10`,
    // Started but not paid (last 14 days), unless the same number has paid since.
    sql<{ id: string; ref: string; wearer_first_name: string; delivery_name: string; mobile: string; bracelet_title: string; amount_paise: number; created_at: Date; marketing_opt_in: boolean }>`
      select o.id, o.ref, o.wearer_first_name, o.delivery_name, o.mobile, o.bracelet_title, o.amount_paise, o.created_at, o.marketing_opt_in
      from orders o
      where o.status in ('pending', 'failed') and o.created_at > now() - interval '14 days'
        and not exists (select 1 from orders p where p.mobile = o.mobile and p.status = 'paid' and p.created_at >= o.created_at)
      order by o.created_at desc limit 20`,
    sql<{ paid: number; revenue: number; started: number; aov: number }>`
      select count(*) filter (where status = 'paid')::int as paid,
             coalesce(sum(amount_paise + upgrade_paise) filter (where status = 'paid'), 0)::int as revenue,
             count(*)::int as started,
             coalesce(avg(amount_paise + upgrade_paise) filter (where status = 'paid'), 0)::int as aov
      from orders where created_at >= ${since}`,
  ]);
  return { byPurpose, partners, coupons, abandoned, totals: totals[0] };
}
