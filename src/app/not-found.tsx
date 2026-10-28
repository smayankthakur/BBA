import Link from "@/components/LocaleLink";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getContent, getSite } from "@/lib/server/content";
import { getUI } from "@/lib/server/lang";
import { LangProvider } from "@/components/LangProvider";
import { uiFor } from "@/lib/i18n/ui";

export async function generateMetadata() {
  return { title: getUI().notFound.metaTitle };
}

export default async function NotFound() {
  const [{ s }, c] = await Promise.all([getSite(), getContent("shared")]);
  const ui = getUI();
  return (
    <LangProvider lang="en" ui={uiFor("en")}>
      <div className="page">
        <a className="skip-link" href="#main">
          {ui.common.skip}
        </a>
        <AnnouncementBar />
        <SiteHeader instagram={s.instagram} youtube={s.youtube} />
        <main id="main" className="nf">
          <p className="nf-code" aria-hidden="true">
            404
          </p>
          <h1 className="h2">{c.notFoundTitle}</h1>
          <p className="nf-text">{c.notFoundText}</p>
          <div className="btn-row">
            <Link className="btn btn-lapis" href="/">
              {ui.common.backHome}
            </Link>
            <Link className="btn btn-line" href="/#edit">
              {ui.common.shopByPurpose}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    </LangProvider>
  );
}
