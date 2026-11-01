import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { headerPurposes } from "@/lib/server/catalog";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import Loader from "@/components/Loader";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import IntentionEdit from "@/components/IntentionEdit";
import MadeForYou from "@/components/MadeForYou";
import NoteFromAmmit from "@/components/NoteFromAmmit";
import Testimonials from "@/components/Testimonials";
import CareSection from "@/components/CareSection";
import SiteFooter from "@/components/SiteFooter";
import QuickOrderMount from "@/components/order/QuickOrderMount";
import StickyOrder from "@/components/order/StickyOrder";
import { lowestPrice } from "@/lib/server/catalog";
import { formatINR } from "@/lib/format";
import type { Metadata } from "next";
import { getContent, getSite } from "@/lib/server/content";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const c = await getContent("home");
  return {
    alternates: alternatesFor(getLang(), "/"),
    ...(c.seoTitle || c.seoDescription ? { title: { absolute: c.seoTitle || undefined } as Metadata["title"], description: c.seoDescription || undefined } : {}),
  };
}

export default async function HomePage({ params }: Params) {
  await pageLang(params);
  const { s } = await getSite();
  const SHOW_LOADER = s.showLoader;
  return (
    <div className={`page${SHOW_LOADER ? " withload" : ""}`}>
      {SHOW_LOADER && (
        <>
          {/* First visit only: later visits skip straight to the page. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.getItem("bba_intro"))document.documentElement.classList.add("intro-seen");else localStorage.setItem("bba_intro","1")}catch(e){}`,
            }}
          />
          <Loader />
        </>
      )}
      <a className="skip-link" href="#main">
        {getUI().common.skip}
      </a>
      <AnnouncementBar />
      <SiteHeader instagram={s.instagram} youtube={s.youtube} purposes={await headerPurposes()} />
      <main id="main">
        <Hero />
        <IntentionEdit />
        <MadeForYou />
        <NoteFromAmmit compact />
        <Testimonials />
        <CareSection />
      </main>
      <SiteFooter />
      <StickyOrder label={tf(getUI().quick.sticky, { amount: formatINR(await lowestPrice()) })} href="/find-your-bracelet" />
      <QuickOrderMount />
    </div>
  );
}
