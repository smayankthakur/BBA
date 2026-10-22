import { LINKS } from "@/data/home";

export default function AnnouncementBar() {
  return (
    <aside className="announce" aria-label="Announcement">
      Every bracelet is read for your date of birth before it&apos;s strung.{" "}
      <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
        Ask Ammit
      </a>
    </aside>
  );
}
