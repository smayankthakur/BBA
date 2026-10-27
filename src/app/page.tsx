import Loader from "@/components/Loader";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import IntentionEdit from "@/components/IntentionEdit";
import ThreeInOne from "@/components/ThreeInOne";
import MulankPicker from "@/components/MulankPicker";
import NoteFromAmmit from "@/components/NoteFromAmmit";
import Gifts from "@/components/Gifts";
import Testimonials from "@/components/Testimonials";
import CareSection from "@/components/CareSection";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";
import { getContent, getSite } from "@/lib/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("home");
  return c.seoTitle || c.seoDescription
    ? { title: { absolute: c.seoTitle || undefined } as Metadata["title"], description: c.seoDescription || undefined }
    : {};
}

export default async function HomePage() {
  const { s } = await getSite();
  const SHOW_LOADER = s.showLoader;
  return (
    <div className={`page${SHOW_LOADER ? " withload" : ""}`}>
      {SHOW_LOADER && <Loader />}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader instagram={s.instagram} youtube={s.youtube} />
      <main id="main">
        <Hero />
        <IntentionEdit />
        <ThreeInOne />
        <MulankPicker />
        <NoteFromAmmit compact />
        <Gifts />
        <Testimonials />
        <CareSection />
      </main>
      <SiteFooter />
    </div>
  );
}
