import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_LIVE, SITE_URL } from "@/lib/site";
import ConsentBanner from "@/components/ConsentBanner";
import JsonLd from "@/components/JsonLd";
import { LangProvider } from "@/components/LangProvider";
import { getSite } from "@/lib/server/content";
import { pageLang } from "@/lib/server/lang";
import { HTML_LANG, LANGS, OG_LOCALE, SEGMENT, alternatesFor, langFromSegment, lp } from "@/lib/i18n/config";
import { uiFor } from "@/lib/i18n/ui";

type P = { params: Promise<{ lang: string }> };

// Unknown languages are refused below (notFound). dynamicParams stays on so
// products added later in the admin panel still get pages.
export function generateStaticParams() {
  return LANGS.map((l) => ({ lang: SEGMENT[l] }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const lang = await pageLang(params);
  const { s } = await getSite();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.seoTitle, template: `%s | ${s.brand}` },
    description: s.seoDescription,
    alternates: alternatesFor(lang, "/"),
    openGraph: { type: "website", siteName: s.brand, title: s.seoTitle, description: s.seoDescription, url: lp(lang, "/"), locale: OG_LOCALE[lang] },
    twitter: { card: "summary_large_image", title: s.seoTitle, description: s.seoDescription },
    // Not indexable until NEXT_PUBLIC_SITE_LIVE=true (see src/lib/site.ts)
    robots: SITE_LIVE ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function LangLayout({ children, params }: P & { children: React.ReactNode }) {
  if (!langFromSegment((await params).lang)) notFound();
  const lang = await pageLang(params);
  const { s } = await getSite();
  return (
    <LangProvider lang={lang} ui={uiFor(lang)}>
      {/* The root <html> is shared by every language; set its lang before anything is read. */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(HTML_LANG[lang])}` }} />
      <div lang={HTML_LANG[lang]} className="lang-root">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: s.brand,
            url: SITE_URL,
            logo: `${SITE_URL}/brand/emblem.png`,
            founder: { "@type": "Person", name: s.ammitName, jobTitle: "Numerologist" },
            telephone: s.phone || undefined,
            address: s.address ? { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "IN" } : undefined,
            sameAs: [s.instagram, s.youtube].filter(Boolean),
          }}
        />
        {children}
        <ConsentBanner />
      </div>
    </LangProvider>
  );
}
