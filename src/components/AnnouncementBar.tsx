import Link from "next/link";
import { getSite } from "@/lib/server/content";

export default async function AnnouncementBar() {
  const { s } = await getSite();
  if (!s.announcement) return null;
  return (
    <aside className="announce" aria-label="Announcement">
      {s.announcement}
      {s.announcementLink && (
        <>
          {" "}
          <Link href="/consultation">{s.announcementLink}</Link>
        </>
      )}
    </aside>
  );
}
