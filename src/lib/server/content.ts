import "server-only";
import { cache } from "react";
import { DEFAULTS, type Defaults, type PageId } from "@/lib/content/defaults";
import { pageDef, type FieldDef, type SubField } from "@/lib/content/fields";
import { safeHref } from "@/lib/content/render";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";

/* ------------------------------------------------------------------ */
/* Reading                                                              */
/* ------------------------------------------------------------------ */

/** Every saved page document, read once per request (or once per static build). */
const loadAll = cache(async (): Promise<Record<string, Record<string, unknown>>> => {
  if (!dbConfigured()) return {};
  try {
    await ensureSchema();
    const rows = await sql<{ id: string; data: Record<string, unknown> }>`select id, data from site_content`;
    return Object.fromEntries(rows.map((r) => [r.id, r.data ?? {}]));
  } catch (e) {
    console.error("[content] falling back to defaults:", e instanceof Error ? e.message : e);
    return {};
  }
});

/** Saved values on top of the defaults. Keys that aren't in the defaults are ignored. */
function merge<T extends Record<string, unknown>>(base: T, saved: Record<string, unknown> | undefined): T {
  if (!saved) return base;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(base)) {
    const v = saved[k];
    if (v === undefined || v === null) continue;
    if (typeof base[k] === typeof v || (Array.isArray(base[k]) && Array.isArray(v))) out[k] = v;
  }
  return out as T;
}

export async function getContent<K extends PageId>(id: K): Promise<Defaults[K]> {
  const all = await loadAll();
  return merge(DEFAULTS[id] as Defaults[K] & Record<string, unknown>, all[id]);
}

export { formatINR } from "@/lib/format";
import { formatINR } from "@/lib/format";

/** Site settings plus the {{placeholders}} every page can use. */
export const getSite = cache(async () => {
  const s = await getContent("settings");
  const grievance = [`${s.grievanceName}, ${s.grievanceDesignation}`, s.email].filter(Boolean).join(", ");
  const vars: Record<string, string | number> = {
    price: formatINR(s.defaultPrice),
    phone: s.phone,
    address: s.address,
    email: s.email,
    legalName: s.legalName || s.brand,
    brand: s.brand,
    founder: s.founder,
    grievance,
    disclaimer: s.disclaimer,
    minDays: s.shippingMinDays,
    maxDays: s.shippingMaxDays,
    whatsapp: s.whatsapp,
    youtube: s.youtube,
    youtubeShorts: s.youtubeShorts,
    instagram: s.instagram,
  };
  return { s, vars };
});

/* ------------------------------------------------------------------ */
/* Saving (admin)                                                       */
/* ------------------------------------------------------------------ */

const LIMIT: Record<string, number> = { text: 300, url: 500, image: 500, color: 7, textarea: 4000, markdown: 60000 };

function cleanScalar(type: SubField["type"] | "markdown", raw: unknown, fallback: unknown): unknown {
  switch (type) {
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? Math.max(0, Math.min(10_000_000, Math.round(n))) : fallback;
    }
    case "toggle":
      return raw === true || raw === "on" || raw === "true";
    case "color":
      return /^#[0-9a-fA-F]{6}$/.test(String(raw ?? "")) ? String(raw) : fallback;
    case "url":
    case "image": {
      const v = String(raw ?? "").trim().slice(0, LIMIT[type]);
      return v === "" || safeHref(v) ? v : fallback;
    }
    case "list": {
      const arr = Array.isArray(raw) ? raw : String(raw ?? "").split("\n");
      return arr.map((x) => String(x).trim().slice(0, 600)).filter(Boolean).slice(0, 100);
    }
    default:
      return String(raw ?? "").replace(/\r\n?/g, "\n").slice(0, LIMIT[type] ?? 4000);
  }
}

function cleanField(f: FieldDef, raw: unknown, fallback: unknown): unknown {
  if (f.type !== "repeater") return cleanScalar(f.type, raw, fallback);
  const items = Array.isArray(raw) ? raw.slice(0, 200) : [];
  const fb = Array.isArray(fallback) ? fallback : [];
  const cleaned = items
    .filter((it) => it && typeof it === "object")
    .map((it, i) => {
      const o: Record<string, unknown> = {};
      for (const sf of f.fields ?? []) o[sf.key] = cleanScalar(sf.type, (it as Record<string, unknown>)[sf.key], (fb[i] as Record<string, unknown> | undefined)?.[sf.key] ?? "");
      return o;
    });
  return f.fixed ? cleaned.slice(0, fb.length).concat(fb.slice(cleaned.length)) : cleaned;
}

/** Validates every field against its definition, then stores the page document. */
export async function saveContent(id: PageId, input: Record<string, unknown>, userId: string) {
  const def = pageDef(id);
  if (!def) throw new Error("Unknown page");
  const current = (await getContent(id)) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const section of def.sections) for (const f of section.fields) data[f.key] = cleanField(f, input[f.key], current[f.key]);
  await ensureSchema();
  await sql`insert into site_content (id, data, updated_at, updated_by) values (${id}, ${JSON.stringify(data)}::jsonb, now(), ${userId})
    on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = excluded.updated_by`;
}

export async function resetContent(id: PageId) {
  await ensureSchema();
  await sql`delete from site_content where id = ${id}`;
}

export async function contentUpdatedAt() {
  if (!dbConfigured()) return {};
  await ensureSchema();
  const rows = await sql<{ id: string; updated_at: string }>`select id, updated_at from site_content`;
  return Object.fromEntries(rows.map((r) => [r.id, r.updated_at]));
}
