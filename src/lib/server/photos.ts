import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const EXT = ["jpg", "jpeg", "webp", "png"];

/**
 * Product photos are picked up automatically at build time from
 * public/products/<slug>/1.jpg, 2.jpg, 3.jpg (jpg/jpeg/webp/png).
 * 1 = on the wrist, 2 = close-up, 3 = in the packaging.
 * Until they exist, the bead-ring illustrations are shown.
 */
/**
 * Adds a short content hash (?v=…) so a replaced photo with the same file name
 * is never served from an old image cache.
 */
export function versioned(rel: string): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", rel));
    return `${rel}?v=${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8)}`;
  } catch {
    return rel;
  }
}

export function productPhotos(slug: string): string[] {
  const out: string[] = [];
  for (const n of [1, 2, 3]) {
    for (const ext of EXT) {
      const rel = `/products/${slug}/${n}.${ext}`;
      if (fs.existsSync(path.join(process.cwd(), "public", rel))) {
        out.push(versioned(rel));
        break;
      }
    }
  }
  return out;
}
