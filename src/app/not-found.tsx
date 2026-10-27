import Link from "next/link";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getContent, getSite } from "@/lib/server/content";

export const metadata = { title: "Page not found — Bracelet By Ammit" };

export default async function NotFound() {
  const [{ s }, c] = await Promise.all([getSite(), getContent("shared")]);
  return (
    <div className="page">
      <a className="skip-link" href="#main">Skip to content</a>
      <AnnouncementBar />
      <SiteHeader instagram={s.instagram} youtube={s.youtube} />
      <main id="main" className="nf">
        <p className="nf-code" aria-hidden="true">404</p>
        <h1 className="h2">{c.notFoundTitle}</h1>
        <p className="nf-text">{c.notFoundText}</p>
        <div className="btn-row">
          <Link className="btn btn-lapis" href="/">Back to the homepage</Link>
          <Link className="btn btn-line" href="/#edit">Shop by intention</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
