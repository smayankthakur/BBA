import { NextResponse } from "next/server";
import { dbConfigured, dbHealth } from "@/lib/server/orders";
import { clientIp, rateLimited } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports only whether the order database is reachable (no data exposed). Also creates the table on first call. */
export async function GET(req: Request) {
  if (rateLimited(`health:${clientIp(req)}`, 20, 60_000)) return NextResponse.json({ db: "busy" }, { status: 429 });
  if (!dbConfigured()) return NextResponse.json({ db: "not_configured" });
  try {
    await dbHealth();
    return NextResponse.json({ db: "ok" });
  } catch {
    return NextResponse.json({ db: "error" }, { status: 500 });
  }
}
