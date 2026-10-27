"use client";

export type MediaItem = {
  id: string;
  url: string;
  filename: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt: string | null;
  created_at: string;
};

const LIMIT = 4 * 1024 * 1024;
const MAX_SIDE = 2000;

/** Phone photos are often 5–15 MB: shrink them in the browser before sending. */
async function shrink(file: File): Promise<Blob> {
  if (file.size <= LIMIT && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    // Formats the browser can't read (e.g. HEIC outside Safari): let the server try.
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  for (const q of [0.9, 0.8, 0.7]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size <= LIMIT) return blob;
  }
  throw new Error("That image is too large. Please use a smaller photo.");
}

export async function uploadImage(file: File): Promise<MediaItem> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) throw new Error(`${file.name} isn't an image.`);
  const body = new FormData();
  const blob = await shrink(file);
  body.append("file", blob, blob === file ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg");
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { media?: MediaItem; error?: string };
  if (!res.ok || !json.media) throw new Error(json.error ?? "Upload failed. Please try again.");
  return json.media;
}

export async function fetchMedia(): Promise<MediaItem[]> {
  const res = await fetch("/api/admin/media", { cache: "no-store" });
  if (!res.ok) throw new Error("Couldn't load the media library.");
  return ((await res.json()) as { media: MediaItem[] }).media;
}
