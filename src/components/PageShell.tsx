import AnnouncementBar from "./AnnouncementBar";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { getSite } from "@/lib/server/content";

/** Wrapper for every inner page: announcement, sticky header, main, footer. */
export default async function PageShell({ children }: { children: React.ReactNode }) {
  const { s } = await getSite();
  return (
    <div className="page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader instagram={s.instagram} youtube={s.youtube} />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
