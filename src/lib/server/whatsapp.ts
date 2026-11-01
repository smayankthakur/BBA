import "server-only";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";
import { SITE_URL } from "@/lib/site";

/**
 * Automatic WhatsApp order updates through a WhatsApp Business API service.
 * Switch on by setting WHATSAPP_PROVIDER = "aisensy" or "interakt" and its key:
 *   AiSensy:  AISENSY_API_KEY  (each message type is an "API campaign" in AiSensy)
 *   Interakt: INTERAKT_API_KEY (each message type is an approved template)
 * Names default to the ones below; override with WA_PAID, WA_DETAILS, WA_SHIPPED.
 * Without these, nothing is sent and the admin panel says so.
 */
export type WaKind = "paid" | "details" | "shipped";
const PROVIDER = (process.env.WHATSAPP_PROVIDER ?? "").toLowerCase();
const AISENSY_KEY = process.env.AISENSY_API_KEY ?? "";
const INTERAKT_KEY = process.env.INTERAKT_API_KEY ?? "";
const AISENSY_URL = process.env.AISENSY_API_URL || "https://backend.aisensy.com/campaign/t1/api/v2";
const INTERAKT_URL = process.env.INTERAKT_API_URL || "https://api.interakt.ai/v1/public/message/";
const LANG = process.env.WHATSAPP_LANG || "en";

export const TEMPLATES: Record<WaKind, { name: string; label: string; params: string[]; sample: string }> = {
  paid: {
    name: process.env.WA_PAID || "order_paid",
    label: "Payment received",
    params: ["Customer's first name", "Order number", "Bracelet", "Tracking page link"],
    sample:
      "Hi {{1}}, thank you! We've received your payment for order {{2}} ({{3}}). Ammit Ji will now read your numbers and design your bracelet. You can follow your order here: {{4}}",
  },
  details: {
    name: process.env.WA_DETAILS || "order_details_needed",
    label: "Please add your details",
    params: ["Customer's first name", "Order number"],
    sample:
      "Hi {{1}}, thank you for your order {{2}} with Bracelet By Ammit. So Ammit Ji can design your bracelet and send it, please reply here with: 1) the wearer's date of birth, 2) the delivery address with PIN code, 3) wrist size if you know it.",
  },
  shipped: {
    name: process.env.WA_SHIPPED || "order_shipped",
    label: "Shipped, with tracking link",
    params: ["Customer's first name", "Order number", "Courier", "Tracking link"],
    sample: "Hi {{1}}, your Bracelet By Ammit order {{2}} is on its way with {{3}}. Track the parcel here: {{4}}",
  },
};

export const whatsappProvider = (): "aisensy" | "interakt" | null =>
  PROVIDER === "aisensy" && AISENSY_KEY ? "aisensy" : PROVIDER === "interakt" && INTERAKT_KEY ? "interakt" : null;

type OrderLike = {
  id: string;
  ref: string;
  mobile: string;
  wearer_first_name: string;
  delivery_name: string;
  bracelet_title: string;
  courier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  lang?: string | null;
};

const trackPage = (o: OrderLike) => `${SITE_URL}${o.lang === "hi" ? "/hi" : o.lang === "hn" ? "/hinglish" : ""}/track?no=${o.ref}`;

function paramsFor(kind: WaKind, o: OrderLike): string[] {
  const name = (o.delivery_name || o.wearer_first_name || "there").split(/\s+/)[0];
  if (kind === "paid") return [name, o.ref, o.bracelet_title, trackPage(o)];
  if (kind === "details") return [name, o.ref];
  return [name, o.ref, o.courier || "our courier", o.tracking_url || trackPage(o)];
}

async function log(o: OrderLike, kind: string, provider: string, status: string, detail: string) {
  if (!dbConfigured()) return;
  await sql`insert into whatsapp_messages (order_id, kind, to_mobile, provider, status, detail)
    values (${o.id}, ${kind}, ${o.mobile}, ${provider}, ${status}, ${detail.slice(0, 500)})`.catch(() => {});
}

/** Already sent successfully? (automatic sends go out once per order and kind) */
export async function alreadySent(orderId: string, kind: WaKind) {
  if (!dbConfigured()) return false;
  await ensureSchema();
  const r = await sql`select 1 from whatsapp_messages where order_id = ${orderId} and kind = ${kind} and status = 'sent' limit 1`;
  return r.length > 0;
}

/** Sends one template message. Returns "sent", "off" (not connected) or throws. */
export async function sendWhatsApp(kind: WaKind, o: OrderLike, opts: { once?: boolean } = {}): Promise<"sent" | "off" | "skipped"> {
  const provider = whatsappProvider();
  if (!provider) return "off";
  if (!/^[6-9]\d{9}$/.test(o.mobile)) return "skipped";
  if (opts.once && (await alreadySent(o.id, kind))) return "skipped";
  const t = TEMPLATES[kind];
  const params = paramsFor(kind, o);
  try {
    let res: Response;
    if (provider === "aisensy") {
      res = await fetch(AISENSY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: AISENSY_KEY,
          campaignName: t.name,
          destination: `91${o.mobile}`,
          userName: (o.delivery_name || o.wearer_first_name || "Customer").slice(0, 60),
          templateParams: params,
          source: "website",
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } else {
      res = await fetch(INTERAKT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${INTERAKT_KEY}` },
        body: JSON.stringify({
          countryCode: "+91",
          phoneNumber: o.mobile,
          callbackData: `${o.ref}:${kind}`,
          type: "Template",
          template: { name: t.name, languageCode: LANG, bodyValues: params },
        }),
        signal: AbortSignal.timeout(15_000),
      });
    }
    const body = (await res.text()).slice(0, 400);
    if (!res.ok) {
      await log(o, kind, provider, "failed", `${res.status} ${body}`);
      throw new Error(`WhatsApp (${provider}) ${res.status}: ${body.slice(0, 160)}`);
    }
    await log(o, kind, provider, "sent", body);
    return "sent";
  } catch (e) {
    if (!(e instanceof Error && e.message.startsWith("WhatsApp ("))) await log(o, kind, provider, "failed", e instanceof Error ? e.message : String(e));
    throw e;
  }
}

/** Automatic, never throws (used after payment / shipping). */
export async function autoWhatsApp(kind: WaKind, o: OrderLike) {
  try {
    return await sendWhatsApp(kind, o, { once: true });
  } catch (e) {
    console.error(`[whatsapp] ${kind} failed`, e instanceof Error ? e.message : e);
    return "failed" as const;
  }
}

export async function whatsappLog(orderId: string) {
  if (!dbConfigured()) return [];
  await ensureSchema();
  return sql<{ id: number; kind: string; status: string; provider: string; detail: string | null; at: Date }>`
    select id, kind, status, provider, detail, at from whatsapp_messages where order_id = ${orderId} order by at desc limit 30`;
}
