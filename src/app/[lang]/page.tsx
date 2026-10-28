import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import Loader from "@/components/Loader";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import IntentionEdit from "@/components/IntentionEdit";
import MadeForYou from "@/components/MadeForYou";
import NoteFromAmmit from "@/components/NoteFromAmmit";
import Gifts from "@/components/Gifts";
import Testimonials from "@/components/Testimonials";
import CareSection from "@/components/CareSection";
import SiteFooter from "@/components/SiteFooter";
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
      {SHOW_LOADER && <Loader />}
      <a className="skip-link" href="#main">
        {getUI().common.skip}
      </a>
      <AnnouncementBar />
      <SiteHeader instagram={s.instagram} youtube={s.youtube} />
      <main id="main">
        <Hero />
        <IntentionEdit />
        <MadeForYou />
        <NoteFromAmmit compact />
        <Gifts />
        <Testimonials />
        <CareSection />
      </main>
      <SiteFooter />
    </div>
  );
}
