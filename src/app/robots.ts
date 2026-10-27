import type { MetadataRoute } from "next";
import { SITE_LIVE, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!SITE_LIVE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/tools/", "/admin", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
