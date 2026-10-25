import Link from "next/link";

export default function AnnouncementBar() {
  return (
    <aside className="announce" aria-label="Announcement">
      Every bracelet is read for your date of birth before it&apos;s strung.{" "}
      <Link href="/consultation">Ask Ammit</Link>
    </aside>
  );
}
