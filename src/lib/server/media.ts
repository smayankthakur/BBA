import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { sql } from "./db";
import { ensureSchema } from "./schema";

export type Media = {
  id: string;
  url: string;
  filename: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt: string | null;
  created_at: string | Date;
};

export const mediaStorageReady = () => !!process.env.BLOB_READ_WRITE_TOKEN || process.env.MEDIA_LOCAL === "1";

const MAX_INPUT = 12 * 1024 * 1024;
const ALLOWED = new Set(["jpeg", "png", "webp", "heic", "heif", "avif"]);

/**
 * Checks the file really is an image (by decoding it, not by its name),
 * straightens it, limits it to 2000px and stores it as WebP.
 */
export async function storeImage(input: Buffer, originalName: string, userId: string): Promise<Media> {
  if (input.length > MAX_INPUT) throw new Error("too-big");
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input, { failOn: "error", limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new Error("not-image");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) throw new Error("not-image");

  const out = await sharp(input, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const name = `media/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  let url: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, out.data, { access: "public", contentType: "image/webp", addRandomSuffix: false });
    url = blob.url;
  } else if (process.env.MEDIA_LOCAL === "1") {
    // Local testing only: files land in public/uploads.
    const file = path.join(process.cwd(), "public", "uploads", name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, out.data);
    url = `/uploads/${name}`;
  } else {
    throw new Error("no-storage");
  }

  await ensureSchema();
  const clean = originalName.replace(/[^\w.\- ]+/g, "").slice(0, 120) || "image";
  const rows = await sql<Media>`insert into media (url, pathname, filename, width, height, bytes, content_type, uploaded_by)
    values (${url}, ${name}, ${clean}, ${out.info.width}, ${out.info.height}, ${out.data.length}, 'image/webp', ${userId})
    returning id, url, filename, width, height, bytes, alt, created_at`;
  return rows[0];
}

export async function listMedia(limit = 200) {
  await ensureSchema();
  return sql<Media>`select id, url, filename, width, height, bytes, alt, created_at from media order by created_at desc limit ${limit}`;
}

/** Refuses to delete an image that a product or page still uses. */
export async function deleteMedia(id: string): Promise<"deleted" | "in-use" | "missing"> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return "missing";
  await ensureSchema();
  const rows = await sql<{ url: string; pathname: string | null }>`select url, pathname from media where id = ${id}`;
  const m = rows[0];
  if (!m) return "missing";
  const used = await sql`select 1 from products where ${m.url} = any(photos)
    union all select 1 from site_content where data::text like ${"%" + m.url.replace(/[%_\\]/g, (c) => "\\" + c) + "%"} limit 1`;
  if (used.length) return "in-use";
  if (m.url.startsWith("http") && process.env.BLOB_READ_WRITE_TOKEN) await del(m.url).catch(() => {});
  else if (m.url.startsWith("/uploads/") && m.pathname) await fs.rm(path.join(process.cwd(), "public", "uploads", m.pathname), { force: true });
  await sql`delete from media where id = ${id}`;
  return "deleted";
}
