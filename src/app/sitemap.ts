import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { BRACELETS, MULANK } from "@/data/pages";
import { GIFTS } from "@/data/home";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/find-your-bracelet",
    "/bracelets",
    ...BRACELETS.map((b) => `/bracelets/${b.slug}`),
    "/mulank",
    ...MULANK.map((m) => `/mulank/${m.number}`),
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
