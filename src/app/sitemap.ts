import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getBracelets, getGifts } from "@/lib/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [BRACELETS, GIFTS] = await Promise.all([getBracelets(), getGifts()]);
  const paths = [
    "/",
    "/find-your-bracelet",
    "/bracelets",
    ...BRACELETS.map((b) => `/bracelets/${b.slug}`),
    "/mulank",
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `/mulank/${n}`),
    "/gifts",
    ...GIFTS.map((g) => `/gifts/${g.slug}`),
    "/numerology",
    "/numerology/mulank-and-bhagyank",
    "/numerology/lo-shu-grid",
    "/size-guide",
    "/privacy",
    "/terms",
    "/shipping",
    "/returns",
    "/about-ammit",
    "/consultation",
    "/bracelet-care",
    "/reviews",
  ];
  return paths.map((p) => ({
    url: `${SITE_URL}${p === "/" ? "/" : p}`,
    changeFrequency: "weekly",
    priority: p === "/" ? 1 : p.split("/").length === 2 ? 0.8 : 0.6,
  }));
}
