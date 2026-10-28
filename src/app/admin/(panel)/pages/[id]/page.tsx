import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Notice from "@/components/admin/Notice";
import ContentForm from "@/components/admin/ContentForm";
import { pageDef } from "@/lib/content/fields";
import { contentKey, contentUpdatedAt, getContent } from "@/lib/server/content";
import { requireAdmin, roleAtLeast } from "@/lib/server/auth";
import { resetContentAction } from "@/app/admin/actions";
import { LANG_NAME, lp, type Lang } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Edit page" };

const TABS: Lang[] = ["en", "hi", "hn"];

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const def = pageDef(id);
  if (!def) notFound();
  const user = await requireAdmin();
  if (def.id === "settings" && !roleAtLeast(user.role, "admin")) redirect("/admin?denied=1");
  const lang: Lang = sp.lang === "hi" || sp.lang === "hn" ? sp.lang : "en";
  const [data, english, updated] = await Promise.all([getContent(def.id, lang), getContent(def.id, "en"), contentUpdatedAt()]);
  const isAdmin = roleAtLeast(user.role, "admin");
  const key = contentKey(def.id, lang);

  return (
    <>
      <div className="ad-head">
        <h1>{def.title}</h1>
      </div>
      <p className="ad-sub">
        <Link href="/admin/pages">← All pages</Link>
      </p>
      <nav className="ad-tabs" aria-label="Language">
        {TABS.map((l) => (
          <Link key={l} href={`/admin/pages/${def.id}${l === "en" ? "" : `?lang=${l}`}`} aria-current={l === lang ? "page" : undefined}>
            {LANG_NAME[l]}
            {l !== "en" && <span className="n">{updated[contentKey(def.id, l)] ? " (edited)" : " (built-in)"}</span>}
          </Link>
        ))}
      </nav>
      {lang !== "en" && (
        <p className="ad-help">
          Only wording is translated here. Prices, links, photos, phone numbers and customers&apos; reviews come from the English tab. Anything left empty shows the
          English text.
        </p>
      )}
      <Notice sp={sp} />
      <ContentForm
        key={`${lang}-${String(updated[key] ?? "default")}`}
        def={def}
        lang={lang}
        initial={data as Record<string, unknown>}
        english={lang === "en" ? undefined : (english as Record<string, unknown>)}
        viewHref={def.path ? lp(lang, def.path) : undefined}
      />
      {isAdmin && updated[key] && (
        <details className="ad-box" style={{ maxWidth: 640 }}>
          <summary>Go back to the original text{lang !== "en" ? ` (${LANG_NAME[lang]})` : ""}</summary>
          <form action={resetContentAction} className="ad-box-body">
            <input type="hidden" name="id" value={def.id} />
            <input type="hidden" name="lang" value={lang} />
            <p>This replaces everything on this screen with the text the site launched with. It can&apos;t be undone.</p>
            <label className="ad-check">
              <input type="checkbox" name="confirm" value="yes" required />
              <span>Yes, reset {def.title}</span>
            </label>
            <div>
              <button className="ad-btn is-danger" type="submit">
                Reset
              </button>
            </div>
          </form>
        </details>
      )}
    </>
  );
}
