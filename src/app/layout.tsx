import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { SITE_LIVE, SITE_URL } from "@/lib/site";
import ConsentBanner from "@/components/ConsentBanner";
import JsonLd from "@/components/JsonLd";
import { getSite } from "@/lib/server/content";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { s } = await getSite();
  const TITLE = s.seoTitle;
  const DESCRIPTION = s.seoDescription;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: TITLE, template: `%s | ${s.brand}` },
    description: DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: s.brand,
      title: TITLE,
      description: DESCRIPTION,
      url: "/",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
    // Not indexable until NEXT_PUBLIC_SITE_LIVE=true (see src/lib/site.ts)
    robots: SITE_LIVE ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#050E8F",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { s } = await getSite();
  return (
    <html lang="en" className={`${cormorant.variable} ${nunito.variable}`}>
      <body>
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
      </body>
    </html>
  );
}
