import { draftMode, cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/server/content";

export const dynamic = "force-dynamic";

/** Leaves "preview of unsaved changes" and goes back to the page. */
export async function GET(req: Request) {
  (await draftMode()).disable();
  (await cookies()).delete(PREVIEW_COOKIE);
  const to = new URL(req.url).searchParams.get("to") ?? "/";
  return NextResponse.redirect(new URL(/^\/(?![\/\\])[^\\\s]*$/.test(to) ? to : "/", req.url), 303);
}
