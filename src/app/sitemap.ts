import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getBracelets } from "@/lib/server/catalog";
import { HREFLANG, LANGS, lp } from "@/lib/i18n/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BRACELETS = await getBracelets();
  const paths = [
    "/",
    "/find-your-bracelet",
    ...BRACELETS.map((b) => `/bracelets/${b.slug}`),
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
  // Every page in all three languages, each listing the others as alternates.
  const abs = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;
  return paths.flatMap((p) =>
    LANGS.map((l) => ({
      url: abs(lp(l, p)),
      changeFrequency: "weekly" as const,
      priority: (p === "/" ? 1 : p.split("/").length === 2 ? 0.8 : 0.6) * (l === "en" ? 1 : 0.9),
      alternates: { languages: Object.fromEntries(LANGS.map((x) => [HREFLANG[x], abs(lp(x, p))])) },
    })),
  );
}
