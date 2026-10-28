import "server-only";
import crypto from "node:crypto";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";

/**
 * Partner programme: each partner has a link (/p/CODE). A visitor who arrives
 * through it gets a referral cookie for 30 days (the most recent partner link
 * wins). If they place an order in that time, the order is credited to the
 * partner and the agreed commission is recorded with it.
 */
export const REF_COOKIE = "bba_ref";
export const VISITOR_COOKIE = "bba_vid";
export const REF_DAYS = 30;
export const PARTNER_CODE_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

export type Partner = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  kind: "percent" | "flat";
  /** percent: whole %, flat: rupees per order */
  rate: number;
  notes: string;
  active: boolean;
  created_at: string | Date;
};

export type PartnerStats = Partner & {
  clicks: number;
  orders: number;
  sales_paise: number;
  earned_paise: number;
  paid_paise: number;
};

export function commissionFor(kind: Partner["kind"], rate: number, amountPaise: number) {
  return kind === "percent" ? Math.floor((amountPaise * rate) / 100) : rate * 100;
}

const cookieValue = (req: Request, name: string) => {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
};

/** Partner credited for an order placed with this request, with the commission it earns. */
export async function attributionFor(req: Request, amountPaise: number) {
  const code = cookieValue(req, REF_COOKIE).toLowerCase();
  if (!PARTNER_CODE_RE.test(code) || !dbConfigured()) return null;
  await ensureSchema();
  const rows = await sql<Partner>`select * from partners where code = ${code} and active`;
  const p = rows[0];
  if (!p) return null;
  return { code: p.code, kind: p.kind, rate: p.rate, commissionPaise: commissionFor(p.kind, p.rate, amountPaise) };
}

export async function findActivePartner(code: string) {
  if (!PARTNER_CODE_RE.test(code) || !dbConfigured()) return null;
  await ensureSchema();
  return (await sql<Partner>`select * from partners where code = ${code} and active`)[0] ?? null;
}

/** One click per visitor per partner per day. */
export async function recordClick(code: string, visitor: string, landing: string) {
  await sql`insert into partner_clicks (partner_code, visitor, landing) values (${code}, ${visitor}, ${landing.slice(0, 200)})
    on conflict (partner_code, visitor, day) do nothing`;
}
export const newVisitorId = () => crypto.randomBytes(12).toString("base64url");

/* ---------------- Admin ---------------- */

export async function listPartners() {
  await ensureSchema();
  return sql<PartnerStats>`select p.*,
      coalesce(c.n, 0) :: int as clicks,
      coalesce(o.n, 0) :: int as orders,
      coalesce(o.sales, 0) :: bigint :: float8 as sales_paise,
      coalesce(o.earned, 0) :: bigint :: float8 as earned_paise,
      coalesce(y.paid, 0) :: bigint :: float8 as paid_paise
    from partners p
    left join (select partner_code, count(*) as n from partner_clicks group by partner_code) c on c.partner_code = p.code
    left join (select partner_code, count(*) as n, sum(amount_paise + upgrade_paise) as sales, sum(commission_paise) as earned
               from orders where status = 'paid' and fulfilment_status <> 'cancelled' and partner_code is not null group by partner_code) o
      on o.partner_code = p.code
    left join (select partner_id, sum(amount_paise) as paid from partner_payouts group by partner_id) y on y.partner_id = p.id
    order by p.created_at desc`;
}

export async function getPartner(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return (await listPartners()).find((p) => p.id === id) ?? null;
}

export async function partnerOrders(code: string) {
  await ensureSchema();
  return sql<{
    id: string; ref: string; created_at: string; status: string; fulfilment_status: string; bracelet_title: string;
    wearer_first_name: string; city: string; amount_paise: number; upgrade_paise: number; commission_paise: number;
  }>`select id, ref, created_at, status, fulfilment_status, bracelet_title, wearer_first_name, city, amount_paise, upgrade_paise, commission_paise
    from orders where partner_code = ${code} order by created_at desc limit 300`;
}

export async function partnerPayouts(id: string) {
  await ensureSchema();
  return sql<{ id: string; amount_paise: number; paid_on: string; reference: string; note: string }>`
    select id, amount_paise, to_char(paid_on, 'YYYY-MM-DD') as paid_on, reference, note from partner_payouts where partner_id = ${id} order by paid_on desc, created_at desc`;
}

export async function partnerClicksByDay(code: string, days = 30) {
  await ensureSchema();
  return sql<{ day: string; n: number }>`select to_char(day, 'YYYY-MM-DD') as day, count(*) :: int as n from partner_clicks
    where partner_code = ${code} and day > (now() at time zone 'Asia/Kolkata')::date - ${days} :: int group by day order by day`;
}

export async function codeInUse(code: string, exceptId?: string) {
  await ensureSchema();
  const rows = await sql<{ id: string }>`select id from partners where code = ${code}`;
  return rows.some((r) => r.id !== exceptId);
}

export async function savePartner(id: string | null, p: Omit<Partner, "id" | "created_at">) {
  await ensureSchema();
  if (id) {
    await sql`update partners set code = ${p.code}, name = ${p.name}, phone = ${p.phone}, email = ${p.email}, kind = ${p.kind},
      rate = ${p.rate}, notes = ${p.notes}, active = ${p.active}, updated_at = now() where id = ${id}`;
    return id;
  }
  const rows = await sql<{ id: string }>`insert into partners (code, name, phone, email, kind, rate, notes, active)
    values (${p.code}, ${p.name}, ${p.phone}, ${p.email}, ${p.kind}, ${p.rate}, ${p.notes}, ${p.active})
    on conflict (code) do nothing returning id`;
  return rows[0]?.id ?? null;
}

export async function deletePartner(id: string) {
  await sql`delete from partners where id = ${id}`;
}

export async function addPayout(partnerId: string, amountPaise: number, paidOn: string, reference: string, note: string, by: string) {
  await sql`insert into partner_payouts (partner_id, amount_paise, paid_on, reference, note, created_by)
    values (${partnerId}, ${amountPaise}, ${paidOn}, ${reference}, ${note}, ${by})`;
}

export async function deletePayout(id: string) {
  await sql`delete from partner_payouts where id = ${id}`;
}
