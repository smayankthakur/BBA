import Loader from "@/components/Loader";
import AnnouncementBar from "@/components/AnnouncementBar";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import IntentionEdit from "@/components/IntentionEdit";
import ThreeInOne from "@/components/ThreeInOne";
import MulankPicker from "@/components/MulankPicker";
import NoteFromAmmit from "@/components/NoteFromAmmit";
import Gifts from "@/components/Gifts";
import CareSection from "@/components/CareSection";
import SiteFooter from "@/components/SiteFooter";
import { SHOW_LOADER } from "@/data/home";

export default function HomePage() {
  return (
    <div className={`page${SHOW_LOADER ? " withload" : ""}`}>
      {SHOW_LOADER && <Loader />}
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <Hero />
        <IntentionEdit />
        <ThreeInOne />
        <MulankPicker />
        <NoteFromAmmit />
        <Gifts />
        <CareSection />
      </main>
      <SiteFooter />
    </div>
  );
}
