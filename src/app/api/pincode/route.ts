import { NextResponse } from "next/server";
import { INDIAN_STATES } from "@/lib/checkoutSchema";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PIN code → city and state, so the customer doesn't have to type them.
 * Uses India Post's public lookup (api.postalpincode.in). If it is slow or
 * down the customer simply fills them in.
 */
const cache = new Map<string, { city: string; state: string } | null>();
const key = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const STATE_BY_KEY = new Map<string, (typeof INDIAN_STATES)[number]>(INDIAN_STATES.map((s) => [key(s), s]));
STATE_BY_KEY.set(key("Andaman and Nicobar Islands"), "Andaman & Nicobar");
STATE_BY_KEY.set(key("Dadra and Nagar Haveli"), "Dadra & Nagar Haveli and Daman & Diu");
STATE_BY_KEY.set(key("Daman and Diu"), "Dadra & Nagar Haveli and Daman & Diu");
STATE_BY_KEY.set(key("Pondicherry"), "Puducherry");
STATE_BY_KEY.set(key("Orissa"), "Odisha");
STATE_BY_KEY.set(key("Chattisgarh"), "Chhattisgarh");
STATE_BY_KEY.set(key("New Delhi"), "Delhi");

const BASE = process.env.PINCODE_API_BASE || "https://api.postalpincode.in";

export async function GET(req: Request) {
  const pin = new URL(req.url).searchParams.get("pin") ?? "";
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ error: "bad pin" }, { status: 400 });
  if (cache.has(pin)) {
    const hit = cache.get(pin);
    return hit ? NextResponse.json(hit, { headers: { "Cache-Control": "public, max-age=86400" } }) : NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (rateLimited(`pin:${clientIp(req)}`, 30, 10 * 60_000)) return NextResponse.json({ error: "slow down" }, { status: 429 });
  try {
    const res = await fetch(`${BASE}/pincode/${pin}`, { signal: AbortSignal.timeout(3500) });
    const data = (await res.json()) as { Status?: string; PostOffice?: { District?: string; State?: string }[] | null }[];
    const po = data?.[0]?.Status === "Success" ? data[0].PostOffice?.[0] : undefined;
    const state = po?.State ? STATE_BY_KEY.get(key(po.State)) : undefined;
    const out = po?.District && state ? { city: po.District, state } : null;
    if (cache.size > 5000) cache.clear();
    cache.set(pin, out);
    return out ? NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=86400" } }) : NextResponse.json({ error: "not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "lookup unavailable" }, { status: 503 });
  }
}
