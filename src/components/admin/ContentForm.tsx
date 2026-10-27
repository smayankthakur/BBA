"use client";

import { useState } from "react";
import MediaPicker from "./MediaPicker";
import { saveContentAction } from "@/app/admin/actions";
import type { FieldDef, PageDef, SubField } from "@/lib/content/fields";

type Data = Record<string, unknown>;
type Item = Record<string, unknown>;

const asText = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function ImageField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ad-box-body" style={{ padding: 0 }}>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          style={{
            width: 120,
            height: 150,
            objectFit: "cover",
            border: "1px solid var(--ad-line)",
            borderRadius: 4,
          }}
        />
      )}
      <div className="ad-actions">
        <button type="button" className="ad-btn" onClick={() => setOpen(true)}>
          {value ? "Replace photo" : "Choose photo"}
        </button>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Photo address"
          style={{ flex: 1, minWidth: 180 }}
        />
      </div>
      {open && (
        <MediaPicker
          onPick={(u) => u[0] && onChange(u[0])}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function Scalar({
  f,
  id,
  value,
  onChange,
}: {
  f: SubField | FieldDef;
  id: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (f.type) {
    case "textarea":
      return (
        <textarea
          id={id}
          rows={3}
          value={asText(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "markdown":
      return (
        <textarea
          id={id}
          rows={16}
          value={asText(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
        />
      );
    case "list":
      return (
        <textarea
          id={id}
          rows={Math.min(
            12,
            Math.max(3, (Array.isArray(value) ? value.length : 0) + 1),
          )}
          value={Array.isArray(value) ? value.join("\n") : asText(value)}
          onChange={(e) => onChange(e.target.value.split("\n"))}
        />
      );
    case "number":
      return (
        <input
          id={id}
          type="number"
          min={0}
          value={asText(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      );
    case "toggle":
      return (
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "url":
      return (
        <input
          id={id}
          type="text"
          inputMode="url"
          value={asText(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "color": {
      const v = asText(value);
      return (
        <span className="ad-color">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Colour picker"
          />
          <input
            id={id}
            value={v}
            onChange={(e) => onChange(e.target.value)}
            maxLength={7}
          />
        </span>
      );
    }
    case "image":
      return <ImageField id={id} value={asText(value)} onChange={onChange} />;
    default:
      return (
        <input
          id={id}
          type="text"
          value={asText(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function Field({
  f,
  id,
  value,
  onChange,
}: {
  f: SubField | FieldDef;
  id: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const help = "help" in f ? f.help : undefined;
  if (f.type === "toggle")
    return (
      <label className="ad-check" htmlFor={id}>
        <Scalar f={f} id={id} value={value} onChange={onChange} />
        <span>{f.label}</span>
      </label>
    );
  return (
    <div className="ad-field">
      <label htmlFor={id} style={{ fontWeight: 600 }}>
        {f.label}
      </label>
      <Scalar f={f} id={id} value={value} onChange={onChange} />
      {help && <small>{help}</small>}
    </div>
  );
}

function Repeater({
  f,
  value,
  onChange,
}: {
  f: FieldDef;
  value: unknown;
  onChange: (v: Item[]) => void;
}) {
  const items = (Array.isArray(value) ? value : []) as Item[];
  const subs = f.fields ?? [];
  // Which items are expanded (kept in step with moves/removals).
  const [open, setOpen] = useState<boolean[]>(() => items.map(() => false));
  const set = (i: number, k: string, v: unknown) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const swap = <T,>(arr: T[], i: number, j: number) => {
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    onChange(swap(items, i, j));
    setOpen((o) => swap(o, i, j));
  };
  const remove = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
    setOpen((o) => o.filter((_, j) => j !== i));
  };
  const blank = (): Item =>
    Object.fromEntries(
      subs.map((s) => [
        s.key,
        s.type === "list"
          ? []
          : s.type === "toggle"
            ? false
            : s.type === "number"
              ? 0
              : "",
      ]),
    );
  const firstText = subs.find(
    (s) => s.type === "text" || s.type === "textarea",
  );
  const label = f.itemLabel ?? "Item";

  return (
    <div className="ad-field">
      <span>{f.label}</span>
      {f.help && <small>{f.help}</small>}
      <div className="ad-rep">
        {items.map((it, i) => {
          const name = firstText ? asText(it[firstText.key]).slice(0, 60) : "";
          const isOpen = !!open[i];
          const bodyId = `${f.key}-item-${i}`;
          return (
            <div className="ad-rep-item" key={i}>
              <div className="ad-rep-head">
                <button
                  type="button"
                  className="ad-rep-toggle"
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  onClick={() =>
                    setOpen((o) =>
                      items.map((_, j) => (j === i ? !isOpen : !!o[j])),
                    )
                  }
                >
                  <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span> {label}{" "}
                  {i + 1}
                  {name && <span className="ad-muted"> · {name}</span>}
                </button>
                <span className="ad-actions">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${label} ${i + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label={`Move ${label} ${i + 1} down`}
                  >
                    ↓
                  </button>
                  {!f.fixed && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label={`Remove ${label} ${i + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </span>
              </div>
              {isOpen && (
                <div className="ad-rep-body" id={bodyId}>
                  {subs.map((s) => (
                    <Field
                      key={s.key}
                      f={s}
                      id={`${f.key}-${i}-${s.key}`}
                      value={it[s.key]}
                      onChange={(v) => set(i, s.key, v)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!f.fixed && (
        <div className="ad-actions">
          <button
            type="button"
            className="ad-btn is-small"
            onClick={() => {
              onChange([...items, blank()]);
              setOpen((o) => [...items.map((_, j) => !!o[j]), true]);
            }}
          >
            Add {label.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ContentForm({
  def,
  initial,
  canSave = true,
}: {
  def: PageDef;
  initial: Data;
  canSave?: boolean;
}) {
  const [data, setData] = useState<Data>(initial);
  const [dirty, setDirty] = useState(false);
  const set = (k: string, v: unknown) => {
    setDirty(true);
    setData((d) => ({ ...d, [k]: v }));
  };

  return (
    <form
      action={saveContentAction}
      className="ad-edit"
      onSubmit={() => setDirty(false)}
    >
      <input type="hidden" name="id" value={def.id} />
      <input type="hidden" name="data" value={JSON.stringify(data)} />
      <div>
        {def.sections.map((s, si) => (
          <details className="ad-box" key={s.title} open={si < 2}>
            <summary>{s.title}</summary>
            <div className="ad-box-body">
              {s.fields.map((f) =>
                f.type === "repeater" ? (
                  <Repeater
                    key={f.key}
                    f={f}
                    value={data[f.key]}
                    onChange={(v) => set(f.key, v)}
                  />
                ) : (
                  <Field
                    key={f.key}
                    f={f}
                    id={`f-${f.key}`}
                    value={data[f.key]}
                    onChange={(v) => set(f.key, v)}
                  />
                ),
              )}
            </div>
          </details>
        ))}
      </div>
      <div className="ad-side-col">
        <section className="ad-box">
          <h2>Save</h2>
          <div className="ad-box-body">
            {dirty && <p className="ad-help">You have unsaved changes.</p>}
            <button
              type="submit"
              className="ad-btn is-primary"
              disabled={!canSave}
            >
              Save changes
            </button>
            {def.path && (
              <a
                className="ad-btn"
                href={def.path}
                target="_blank"
                rel="noopener noreferrer"
              >
                View page ↗
              </a>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}
