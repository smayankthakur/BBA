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
import { SHOW_LOADER } from "@/data/home";

export default function HomePage() {
  return (
    <div className={`page${SHOW_LOADER ? " withload" : ""}`}>
      {SHOW_LOADER && <Loader />}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader />
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
