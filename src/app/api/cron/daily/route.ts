import { NextResponse } from "next/server";
import { ordersMissingDetails } from "@/lib/server/orders";
import { autoWhatsApp, whatsappProvider } from "@/lib/server/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Once a day (vercel.json → crons): WhatsApp "please add your details" to
 * customers who paid for a quick order 3+ hours ago and still haven't added
 * the birth date or address. Each order gets this message once.
 * Vercel sends "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!whatsappProvider()) return NextResponse.json({ ok: true, sent: 0, note: "WhatsApp not connected" });
  const list = await ordersMissingDetails();
  let sent = 0;
  for (const o of list) if ((await autoWhatsApp("details", o)) === "sent") sent++;
  return NextResponse.json({ ok: true, checked: list.length, sent });
}
