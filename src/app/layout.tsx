import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Bracelet By Ammit — Crystal bracelets chosen for your birth date",
  description:
    "Choose the intention. Numerologist Ammit Kukreja chooses the crystals for your birth date, then strings them by hand.",
  icons: { icon: "/brand/emblem.png" },
};

export const viewport: Viewport = {
  themeColor: "#050E8F",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
