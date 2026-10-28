"use client";

import { usePathname } from "next/navigation";
import { LANGS, LANG_NAME, HTML_LANG, lp, splitPath } from "@/lib/i18n/config";
import { useLang } from "./LangProvider";

/** English · हिन्दी · Hinglish — the same page in another language. */
export default function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, ui } = useLang();
  const { path } = splitPath(usePathname() ?? "/");
  return (
    <nav className={`lang-switch ${className}`.trim()} aria-label={ui.common.language}>
      {LANGS.map((l) =>
        l === lang ? (
          <span key={l} aria-current="true" lang={HTML_LANG[l]}>
            {LANG_NAME[l]}
          </span>
        ) : (
          // A plain link: the whole page changes language, so reload it fully.
          <a key={l} href={lp(l, path)} lang={HTML_LANG[l]} hrefLang={HTML_LANG[l]}>
            {LANG_NAME[l]}
          </a>
        ),
      )}
    </nav>
  );
}
