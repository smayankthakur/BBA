import type { Lang } from "./config";
import { UI_EN, type UI } from "./ui.en";
import { UI_HI } from "./ui.hi";
import { UI_HN } from "./ui.hn";
import { UI_HI_EXTRA, UI_HN_EXTRA } from "./ui.extra";

export type { UI };

type Deep<T> = { [K in keyof T]?: T[K] extends string[] ? string[] : T[K] extends object ? Deep<T[K]> : T[K] };

/** Translation on top of English, so a missing string falls back to English. */
function over<T>(base: T, tr: Deep<T> | undefined): T {
  if (!tr) return base;
  if (Array.isArray(base)) return (Array.isArray(tr) && tr.length === base.length ? tr : base) as T;
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(base as object)) out[k] = over((base as Record<string, unknown>)[k], (tr as Record<string, unknown>)[k] as never);
    for (const k of Object.keys(tr as object)) if (!(k in out)) out[k] = (tr as Record<string, unknown>)[k];
    return out as T;
  }
  return (typeof tr === typeof base && (tr as unknown) !== "" ? tr : base) as T;
}

const ALL: Record<Lang, UI> = {
  en: UI_EN,
  hi: over(over(UI_EN, UI_HI as Deep<UI>), UI_HI_EXTRA as Deep<UI>),
  hn: over(over(UI_EN, UI_HN as Deep<UI>), UI_HN_EXTRA as Deep<UI>),
};
export const uiFor = (lang: Lang): UI => ALL[lang] ?? UI_EN;

/** "{name}" placeholders. */
export const tf = (s: string, v: Record<string, string | number | undefined>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (v[k] === undefined ? m : String(v[k])));
