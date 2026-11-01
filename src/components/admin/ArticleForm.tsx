"use client";

import { useState } from "react";
import MediaPicker from "./MediaPicker";
import { saveArticleAction } from "@/app/admin/actions";
import { slugify } from "@/lib/catalog-types";
import type { Article } from "@/lib/article-types";

const MD_HELP =
  "Formatting: ## Heading, ### Smaller heading, - bullet, 1. numbered, **bold**, *italic*, [link text](/bracelets/love-life). Use links to bracelet pages so readers can order.";

/** English article (shared fields: address, photo, bracelet, status). */
export default function ArticleForm({ a, purposes }: { a: Article | null; purposes: { slug: string; title: string }[] }) {
  const [title, setTitle] = useState(a?.title ?? "");
  const [slug, setSlug] = useState(a?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!a);
  const [cover, setCover] = useState(a?.cover ?? "");
  const [pick, setPick] = useState(false);
  const [dirty, setDirty] = useState(false);
  return (
    <form action={saveArticleAction} className="ad-edit" onChange={() => setDirty(true)} onSubmit={() => setDirty(false)}>
      <input type="hidden" name="id" value={a?.id ?? ""} />
      <input type="hidden" name="cover" value={cover} />
      <div>
        <section className="ad-box">
          <div className="ad-box-body">
            <label className="ad-field">
              <span>Title</span>
              <input
                name="title"
                className="ad-title-input"
                required
                maxLength={140}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugEdited) setSlug(slugify(e.target.value));
                }}
              />
            </label>
            <label className="ad-field">
              <span>Web address</span>
              <span className="ad-slug">
                /articles/
                <input
                  name="slug"
                  required
                  maxLength={90}
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                />
              </span>
              <small>Lowercase letters, numbers and dashes. Changing it breaks links people already have.</small>
            </label>
            <label className="ad-field">
              <span>Short summary</span>
              <textarea name="excerpt" rows={2} maxLength={300} defaultValue={a?.excerpt ?? ""} />
              <small>Shown under the title and on the articles list.</small>
            </label>
            <label className="ad-field">
              <span>Article</span>
              <textarea name="body" rows={22} className="is-md" defaultValue={a?.body ?? ""} />
              <small>{MD_HELP}</small>
            </label>
          </div>
        </section>
        <details className="ad-box">
          <summary>Google (optional)</summary>
          <div className="ad-box-body">
            <label className="ad-field">
              <span>Title on Google</span>
              <input name="seoTitle" maxLength={70} defaultValue={a?.seoTitle ?? ""} />
              <small>About 60 characters. Empty = the article title.</small>
            </label>
            <label className="ad-field">
              <span>Description on Google</span>
              <textarea name="seoDescription" rows={2} maxLength={170} defaultValue={a?.seoDescription ?? ""} />
              <small>About 155 characters. Empty = the short summary.</small>
            </label>
          </div>
        </details>
      </div>
      <div className="ad-side-col">
        <section className="ad-box">
          <h2>Publish</h2>
          <div className="ad-box-body">
            <label className="ad-field">
              <span>Status</span>
              <select name="status" defaultValue={a?.status ?? "draft"}>
                <option value="draft">Draft (not on the site)</option>
                <option value="published">Published</option>
              </select>
            </label>
            {dirty && <p className="ad-help">You have unsaved changes.</p>}
            <button type="submit" className="ad-btn is-primary">
              Save
            </button>
            {a?.status === "published" && (
              <a className="ad-btn" href={`/articles/${a.slug}`} target="_blank" rel="noopener noreferrer">
                View article ↗
              </a>
            )}
          </div>
        </section>
        <section className="ad-box">
          <h2>Bracelet</h2>
          <div className="ad-box-body">
            <label className="ad-field">
              <span>Leads to</span>
              <select name="purpose" defaultValue={a?.purpose ?? ""}>
                <option value="">None</option>
                {purposes.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
              <small>Shown at the end of the article, and the article is linked from that bracelet&apos;s page.</small>
            </label>
          </div>
        </section>
        <section className="ad-box">
          <h2>Photo</h2>
          <div className="ad-box-body">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 4, border: "1px solid var(--ad-line)" }} />
            )}
            <div className="ad-actions">
              <button type="button" className="ad-btn" onClick={() => setPick(true)}>
                {cover ? "Replace photo" : "Choose photo"}
              </button>
              {cover && (
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => {
                    setCover("");
                    setDirty(true);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <small className="ad-help">Empty = the bracelet&apos;s first photo.</small>
            {pick && (
              <MediaPicker
                addLabel="Use this photo"
                onPick={(u) => {
                  if (u[0]) {
                    setCover(u[0]);
                    setDirty(true);
                  }
                }}
                onClose={() => setPick(false)}
              />
            )}
          </div>
        </section>
      </div>
    </form>
  );
}
