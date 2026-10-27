import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/server/adminApi";
import { listMedia } from "@/lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Media library for the image picker. */
export async function GET(req: Request) {
  const user = await apiAdmin(req, "editor", false);
  if (user instanceof Response) return user;
  return NextResponse.json({ media: await listMedia() }, { headers: { "Cache-Control": "no-store" } });
}
