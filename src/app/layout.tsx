import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Mukta, Nunito_Sans, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { SITE_LIVE, SITE_URL } from "@/lib/site";

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

// Devanagari for the Hindi pages: only downloaded when Hindi text is on screen.
const tiro = Tiro_Devanagari_Hindi({
  subsets: ["devanagari"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-tiro",
  display: "swap",
  preload: false,
});
const mukta = Mukta({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: SITE_LIVE ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050E8F",
};

/** Shared by every language and the admin panel. Each language sets <html lang> itself. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${nunito.variable} ${tiro.variable} ${mukta.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
