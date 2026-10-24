import "server-only";
import fs from "node:fs";
import path from "node:path";

const EXT = ["jpg", "jpeg", "webp", "png"];

/**
 * Product photos are picked up automatically at build time from
 * public/products/<slug>/1.jpg, 2.jpg, 3.jpg (jpg/jpeg/webp/png).
 * 1 = on the wrist, 2 = close-up, 3 = in the packaging.
 * Until they exist, the bead-ring illustrations are shown.
 */
export function productPhotos(slug: string): string[] {
  const out: string[] = [];
  for (const n of [1, 2, 3]) {
    for (const ext of EXT) {
      const rel = `/products/${slug}/${n}.${ext}`;
      if (fs.existsSync(path.join(process.cwd(), "public", rel))) {
        out.push(rel);
        break;
      }
    }
  }
  return out;
}
