"use client";

import { useState } from "react";
import Link from "next/link";
import MediaPicker from "./MediaPicker";
import { saveProductAction, productStatusAction } from "@/app/admin/actions";
import {
  slugify,
  type Product,
  type ProductKind,
  type Visual,
} from "@/lib/catalog-types";

type Props = {
  product: Product | null;
  kind: ProductKind;
  defaultPrice: number;
  newVisual: Visual;
  siteUrl: string;
};

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#7a3fc0";
  return (
    <label className="ad-field">
      <span>{label}</span>
      <span className="ad-color">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  );
}

export default function ProductForm({
  product,
  kind,
  defaultPrice,
  newVisual,
  siteUrl,
}: Props) {
  const p = product;
  const isGift = kind === "gift";
  const base = isGift ? "/gifts" : "/bracelets";
  const [title, setTitle] = useState(p?.title ?? "");
  const [slug, setSlug] = useState(p?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!p);
  const [photos, setPhotos] = useState<string[]>(p?.photos ?? []);
  const [visual, setVisual] = useState<Visual>(p?.visual ?? newVisual);
  const [picker, setPicker] = useState(false);

  const move = (i: number, d: number) =>
    setPhotos((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const setRing = (r: number, c: number, v: string) =>
    setVisual((x) => {
      const rings = x.rings.map((t) => [...t]) as Visual["rings"];
      rings[r][c] = v;
      return { ...x, rings };
    });
  const setCard = (i: number, v: string) =>
    setVisual((x) => {
      const cards = [...x.cards] as Visual["cards"];
      cards[i] = v;
      return { ...x, cards };
    });
  const setBead = (i: number, v: string) =>
    setVisual((x) => {
      const beads = [...(x.beads ?? x.rings[0])] as Visual["rings"][0];
      beads[i] = v;
      return { ...x, beads };
    });

  return (
    <>
      <form action={saveProductAction} className="ad-edit">
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="photos" value={JSON.stringify(photos)} />
        <input type="hidden" name="visual" value={JSON.stringify(visual)} />

        <div>
          <label className="ad-field">
            <span className="sr-only">Title</span>
            <input
              className="ad-title-input"
              name="title"
              required
              maxLength={120}
              placeholder={
                isGift ? "Gift name" : "Bracelet name, e.g. Money & wealth"
              }
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <p className="ad-slug">
            <span className="ad-muted">Web address:</span>
            <span className="ad-muted">
              {siteUrl.replace(/^https?:\/\//, "")}
              {base}/
            </span>
            <input
              name="slug"
              aria-label="Web address (slug)"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                );
              }}
            />
          </p>
          {p?.slug === "3-in-1" && (
            <p className="ad-help">
              This is the 3 in 1 shown in its own homepage section. Keep the web
              address as 3-in-1.
            </p>
          )}

          <section className="ad-box">
            <h2>Description</h2>
            <div className="ad-box-body">
              <label className="ad-field">
                <span>Short description</span>
                <textarea
                  name="blurb"
                  rows={2}
                  maxLength={400}
                  defaultValue={p?.blurb ?? ""}
                />
                <small>
                  Shown on cards and at the top of the product page.
                </small>
              </label>
              <label className="ad-field">
                <span>
                  {isGift ? "About this gift" : "About this bracelet"}
                </span>
                <textarea
                  name="intro"
                  rows={8}
                  defaultValue={(p?.intro ?? []).join("\n\n")}
                />
                <small>Leave an empty line between paragraphs.</small>
              </label>
              <label className="ad-field">
                <span>Highlighted note</span>
                <textarea
                  name="note"
                  rows={2}
                  maxLength={600}
                  defaultValue={p?.note ?? ""}
                />
                <small>Optional. Shown in a box under the description.</small>
              </label>
            </div>
          </section>

          <section className="ad-box">
            <h2>Photos</h2>
            <div className="ad-box-body">
              {photos.length > 0 ? (
                <div className="ad-photos">
                  {photos.map((u, i) => (
                    <div className="ad-photo" key={u + i}>
                      {i === 0 && <span className="ad-badge">Main</span>}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" />
                      <div className="ad-photo-bar">
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          aria-label={`Move photo ${i + 1} earlier`}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPhotos((l) => l.filter((_, j) => j !== i))
                          }
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={i === photos.length - 1}
                          aria-label={`Move photo ${i + 1} later`}
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ad-muted">
                  No photos yet. Without a photo the site shows a coloured bead
                  illustration.
                </p>
              )}
              <div className="ad-actions">
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => setPicker(true)}
                >
                  Add photos
                </button>
              </div>
              <label className="ad-field">
                <span>Photo description</span>
                <input
                  name="photoAlt"
                  maxLength={200}
                  defaultValue={p?.photoAlt ?? ""}
                />
                <small>
                  For screen readers and Google, e.g. &ldquo;Citrine and pyrite
                  bracelet on a wrist&rdquo;.
                </small>
              </label>
            </div>
          </section>

          <section className="ad-box">
            <h2>{isGift ? "Lists" : "Details"}</h2>
            <div className="ad-box-body">
              <div className="ad-grid-2">
                <label className="ad-field">
                  <span>
                    {isGift
                      ? "What to send us"
                      : "This bracelet is for you if…"}
                  </span>
                  <textarea
                    name="listA"
                    rows={6}
                    defaultValue={(p?.listA ?? []).join("\n")}
                  />
                  <small>One point per line.</small>
                </label>
                {isGift ? (
                  <label className="ad-field">
                    <span>Gift ideas</span>
                    <textarea
                      name="listB"
                      rows={6}
                      defaultValue={(p?.listB ?? []).join("\n")}
                    />
                    <small>One point per line.</small>
                  </label>
                ) : (
                  <label className="ad-field">
                    <span>Crystals</span>
                    <textarea
                      name="crystals"
                      rows={6}
                      defaultValue={(p?.crystals ?? []).join("\n")}
                    />
                    <small>One crystal per line.</small>
                  </label>
                )}
              </div>
              {isGift && (
                <input
                  type="hidden"
                  name="crystals"
                  value={(p?.crystals ?? []).join("\n")}
                />
              )}
              {!isGift && (
                <input
                  type="hidden"
                  name="listB"
                  value={(p?.listB ?? []).join("\n")}
                />
              )}
            </div>
          </section>

          <details className="ad-box">
            <summary>Video</summary>
            <div className="ad-box-body">
              <div className="ad-grid-2">
                <label className="ad-field">
                  <span>YouTube link</span>
                  <input
                    name="videoId"
                    defaultValue={
                      p?.videoId
                        ? `https://youtube.com/shorts/${p.videoId}`
                        : ""
                    }
                    placeholder="https://youtube.com/shorts/…"
                  />
                </label>
                <label className="ad-field">
                  <span>Video title</span>
                  <input
                    name="videoTitle"
                    maxLength={120}
                    defaultValue={p?.videoTitle ?? ""}
                  />
                </label>
              </div>
            </div>
          </details>

          <details className="ad-box">
            <summary>Search engines (Google)</summary>
            <div className="ad-box-body">
              <label className="ad-field">
                <span>Title in Google</span>
                <input
                  name="seoTitle"
                  maxLength={120}
                  defaultValue={p?.seoTitle ?? ""}
                  placeholder={
                    title ? `${title}${isGift ? "" : " bracelet"}` : ""
                  }
                />
              </label>
              <label className="ad-field">
                <span>Description in Google</span>
                <textarea
                  name="seoDescription"
                  rows={2}
                  maxLength={300}
                  defaultValue={p?.seoDescription ?? ""}
                />
                <small>Leave empty to use the short description.</small>
              </label>
            </div>
          </details>

          <details className="ad-box">
            <summary>Colours (used when there is no photo)</summary>
            <div className="ad-box-body">
              <div className="ad-grid-2">
                <ColorInput
                  label="List dot colour"
                  value={visual.sphere}
                  onChange={(v) => setVisual((x) => ({ ...x, sphere: v }))}
                />
                <ColorInput
                  label="List dot shade"
                  value={visual.sphereShade}
                  onChange={(v) => setVisual((x) => ({ ...x, sphereShade: v }))}
                />
              </div>
              {isGift ? (
                <>
                  <label className="ad-field">
                    <span>Background</span>
                    <input
                      value={visual.gradient ?? ""}
                      onChange={(e) =>
                        setVisual((x) => ({ ...x, gradient: e.target.value }))
                      }
                    />
                    <small>
                      A colour (#e9dcf5) or a CSS linear-gradient(…).
                    </small>
                  </label>
                  <div className="ad-grid-3">
                    {[0, 1, 2].map((i) => (
                      <ColorInput
                        key={i}
                        label={`Bead ${i + 1}`}
                        value={(visual.beads ?? visual.rings[0])[i]}
                        onChange={(v) => setBead(i, v)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {[0, 1, 2].map((r) => (
                    <div key={r}>
                      <p className="ad-help">Picture {r + 1}</p>
                      <label className="ad-field">
                        <span>Background</span>
                        <input
                          value={visual.cards[r]}
                          onChange={(e) => setCard(r, e.target.value)}
                        />
                      </label>
                      <div className="ad-grid-3">
                        {[0, 1, 2].map((c) => (
                          <ColorInput
                            key={c}
                            label={`Bead ${c + 1}`}
                            value={visual.rings[r][c]}
                            onChange={(v) => setRing(r, c, v)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </details>
        </div>

        <div className="ad-side-col">
          <section className="ad-box">
            <h2>Publish</h2>
            <div className="ad-box-body">
              <label className="ad-field">
                <span>Status</span>
                <select
                  name="status"
                  defaultValue={p?.status === "draft" ? "draft" : "published"}
                >
                  <option value="published">
                    Published (visible on the site)
                  </option>
                  <option value="draft">Draft (hidden)</option>
                </select>
              </label>
              <label className="ad-field">
                <span>Price (₹)</span>
                <input
                  name="price"
                  type="number"
                  min={1}
                  max={1000000}
                  step={1}
                  required
                  defaultValue={p?.priceInr ?? defaultPrice}
                />
                {!isGift && (
                  <small>This is what the customer pays at checkout.</small>
                )}
              </label>
              <label className="ad-field">
                <span>Order in lists</span>
                <input
                  name="sort"
                  type="number"
                  min={0}
                  max={100000}
                  defaultValue={p?.sort ?? 100}
                />
                <small>Lower numbers come first.</small>
              </label>
              {!isGift && (
                <label className="ad-check">
                  <input
                    type="checkbox"
                    name="inList"
                    defaultChecked={p ? p.inList : true}
                  />
                  <span>
                    Show in the homepage intention list and the 60-second
                    reading
                  </span>
                </label>
              )}
              <div className="ad-actions">
                <button type="submit" className="ad-btn is-primary">
                  {p ? "Update" : "Publish"}
                </button>
                {p?.status === "published" && (
                  <a
                    className="ad-btn"
                    href={`${base}/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View ↗
                  </a>
                )}
              </div>
              {p && (
                <button
                  type="submit"
                  className="ad-link-btn is-danger"
                  form="ad-trash-form"
                >
                  Move to trash
                </button>
              )}
            </div>
          </section>
          <p>
            <Link href={`/admin/products?kind=${kind}`}>
              ← All {isGift ? "gifts" : "bracelets"}
            </Link>
          </p>
        </div>

        {picker && (
          <MediaPicker
            multiple
            onPick={(urls) =>
              setPhotos((l) =>
                [...l, ...urls.filter((u) => !l.includes(u))].slice(0, 12),
              )
            }
            onClose={() => setPicker(false)}
          />
        )}
      </form>
      {/* Separate form so "Move to trash" doesn't submit the edit form. */}
      {p && (
        <form id="ad-trash-form" action={productStatusAction} hidden>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="to" value="trash" />
        </form>
      )}
    </>
  );
}
