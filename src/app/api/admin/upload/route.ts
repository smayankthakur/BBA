import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/server/adminApi";
import { mediaStorageReady, storeImage } from "@/lib/server/media";
import { logAction } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  "too-big": "That image is too large. Please use one under 12 MB.",
  "not-image": "That file isn't a photo we can use (JPG, PNG, WebP or HEIC).",
  "no-storage": "Image storage isn't connected yet. Add Vercel Blob to the project.",
};

export async function POST(req: Request) {
  const user = await apiAdmin(req);
  if (user instanceof Response) return user;
  if (!mediaStorageReady()) return NextResponse.json({ error: MESSAGES["no-storage"] }, { status: 503 });
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > 4.4 * 1024 * 1024) return NextResponse.json({ error: MESSAGES["too-big"] }, { status: 413 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  try {
    const media = await storeImage(Buffer.from(await file.arrayBuffer()), file.name, user.id);
    await logAction(user.id, "media.upload", media.id);
    return NextResponse.json({ media });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (!MESSAGES[code]) console.error("[upload]", e);
    return NextResponse.json({ error: MESSAGES[code] ?? "Upload failed. Please try again." }, { status: MESSAGES[code] ? 400 : 500 });
  }
}
