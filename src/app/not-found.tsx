import Link from "next/link";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Page not found — Bracelet By Ammit" };

export default function NotFound() {
  return (
    <div className="page">
      <a className="skip-link" href="#main">Skip to content</a>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main" className="nf">
        <p className="nf-code" aria-hidden="true">404</p>
        <h1 className="h2">This page has slipped off the strand</h1>
        <p className="nf-text">The link may be old, or the page may have moved. Start again from the homepage.</p>
        <div className="btn-row">
          <Link className="btn btn-lapis" href="/">Back to the homepage</Link>
          <Link className="btn btn-line" href="/#edit">Shop by intention</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
