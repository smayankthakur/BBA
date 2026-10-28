import Link from "./LocaleLink";
import LangSwitch from "./LangSwitch";
import { getSite } from "@/lib/server/content";
import { getUI } from "@/lib/server/lang";

export default async function AnnouncementBar() {
  const { s } = await getSite();
  const ui = getUI();
  return (
    <aside className="announce" aria-label={ui.announce}>
      <span className="announce-text">
        {s.announcement}
        {s.announcement && s.announcementLink && (
          <>
            {" "}
            <Link href="/consultation">{s.announcementLink}</Link>
          </>
        )}
      </span>
      <LangSwitch className="is-bar" />
    </aside>
  );
}
