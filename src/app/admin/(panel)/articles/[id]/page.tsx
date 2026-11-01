import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Notice from "@/components/admin/Notice";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ArticleForm from "@/components/admin/ArticleForm";
import { requireAdmin, roleAtLeast } from "@/lib/server/auth";
import { adminGetArticle } from "@/lib/server/articles";
import { getBracelets } from "@/lib/server/catalog";
import { deleteArticleAction, saveArticleTranslationAction } from "@/app/admin/actions";
import { LANG_NAME } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Article" };

const TABS = ["en", "hi", "hn"] as const;

export default async function EditArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireAdmin("editor");
  const a = await adminGetArticle(id);
  if (!a) notFound();
  const lang = sp.lang === "hi" || sp.lang === "hn" ? sp.lang : "en";
  const purposes = (await getBracelets()).filter((b) => b.inList).map((b) => ({ slug: b.slug, title: b.title }));
  const t = lang === "en" ? null : (a.i18n?.[lang] ?? {});

  return (
    <>
      <div className="ad-head">
        <h1>{a.title}</h1>
      </div>
      <p className="ad-sub">
        <Link href="/admin/articles">← All articles</Link>
      </p>
      <nav className="ad-tabs" aria-label="Language">
        {TABS.map((l) => (
          <Link key={l} href={`/admin/articles/${a.id}${l === "en" ? "" : `?lang=${l}`}`} aria-current={l === lang ? "page" : undefined}>
            {LANG_NAME[l]}
            {l !== "en" && <span className="n">{a.i18n?.[l]?.title ? " (done)" : " (not yet)"}</span>}
          </Link>
        ))}
      </nav>
      <Notice sp={sp} />
      {lang === "en" ? (
        <ArticleForm a={a} purposes={purposes} />
      ) : (
        <form action={saveArticleTranslationAction} className="ad-edit">
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="lang" value={lang} />
          <div>
            <section className="ad-box">
              <div className="ad-box-body">
                <p className="ad-help">Anything left empty shows the English. The web address, photo and bracelet come from the English tab.</p>
                <label className="ad-field">
                  <span>Title</span>
                  <input name="title" maxLength={140} defaultValue={t?.title ?? ""} />
                  <small className="ad-en" lang="en">
                    English: {a.title}
                  </small>
                </label>
                <label className="ad-field">
                  <span>Short summary</span>
                  <textarea name="excerpt" rows={2} maxLength={300} defaultValue={t?.excerpt ?? ""} />
                  <small className="ad-en" lang="en">
                    English: {a.excerpt}
                  </small>
                </label>
                <label className="ad-field">
                  <span>Article</span>
                  <textarea name="body" rows={22} className="is-md" defaultValue={t?.body ?? ""} />
                </label>
                <label className="ad-field">
                  <span>Title on Google</span>
                  <input name="seoTitle" maxLength={70} defaultValue={t?.seoTitle ?? ""} />
                </label>
                <label className="ad-field">
                  <span>Description on Google</span>
                  <textarea name="seoDescription" rows={2} maxLength={170} defaultValue={t?.seoDescription ?? ""} />
                </label>
              </div>
            </section>
            <details className="ad-box">
              <summary>English article (for reference)</summary>
              <div className="ad-box-body">
                <pre className="ad-ref" lang="en">
                  {a.body}
                </pre>
              </div>
            </details>
          </div>
          <div className="ad-side-col">
            <section className="ad-box">
              <h2>Save</h2>
              <div className="ad-box-body">
                <button type="submit" className="ad-btn is-primary">
                  Save {LANG_NAME[lang]}
                </button>
                {a.status === "published" && (
                  <a className="ad-btn" href={`/${lang === "hi" ? "hi" : "hinglish"}/articles/${a.slug}`} target="_blank" rel="noopener noreferrer">
                    View ↗
                  </a>
                )}
              </div>
            </section>
          </div>
        </form>
      )}
      {lang === "en" && roleAtLeast(user.role, "admin") && (
        <details className="ad-box" style={{ maxWidth: 640 }}>
          <summary>Delete this article</summary>
          <form action={deleteArticleAction} className="ad-box-body">
            <input type="hidden" name="id" value={a.id} />
            <p className="ad-help">This removes it from the site in every language. It can&apos;t be undone.</p>
            <ConfirmButton className="ad-btn is-danger" message={`Delete "${a.title}"?`}>
              Delete article
            </ConfirmButton>
          </form>
        </details>
      )}
    </>
  );
}
