import AnnouncementBar from "./AnnouncementBar";
import { headerPurposes } from "@/lib/server/catalog";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { getSite } from "@/lib/server/content";
import { getUI } from "@/lib/server/lang";
import QuickOrderMount from "./order/QuickOrderMount";

/** Wrapper for every inner page: announcement, sticky header, main, footer. */
export default async function PageShell({ children }: { children: React.ReactNode }) {
  const { s } = await getSite();
  return (
    <div className="page">
      <a className="skip-link" href="#main">
        {getUI().common.skip}
      </a>
      <AnnouncementBar />
      <SiteHeader instagram={s.instagram} youtube={s.youtube} purposes={await headerPurposes()} />
      <main id="main">{children}</main>
      <SiteFooter />
      <QuickOrderMount />
    </div>
  );
}
