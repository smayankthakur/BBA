import "server-only";
import { cache } from "react";
import { DEFAULT_LANG, langFromSegment, type Lang } from "@/lib/i18n/config";

/**
 * The language of the page being rendered, for server code that has no
 * params (content, catalogue, components). Set by the [lang] layout and by
 * each page before it renders children; one value per request.
 */
const store = cache(() => ({ lang: DEFAULT_LANG as Lang }));
export const setLang = (lang: Lang) => {
  store().lang = lang;
};
export const getLang = (): Lang => store().lang;

/** Start of every page and generateMetadata: read [lang] and make it the request language. */
export async function pageLang(params: Promise<{ lang: string }> | { lang: string } | undefined): Promise<Lang> {
  const p = params ? await params : undefined;
  const lang = langFromSegment(p?.lang) ?? DEFAULT_LANG;
  setLang(lang);
  return lang;
}

import { uiFor } from "@/lib/i18n/ui";
/** Interface text for the page being rendered. */
export const getUI = () => uiFor(getLang());

import { splitPath } from "@/lib/i18n/config";
/** Language of the page that sent an API request (from its Referer), for messages. */
export function langOfRequest(req: Request): Lang {
  try {
    return splitPath(new URL(req.headers.get("referer") ?? "").pathname).lang;
  } catch {
    return DEFAULT_LANG;
  }
}
