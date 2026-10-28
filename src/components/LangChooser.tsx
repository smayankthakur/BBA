"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Medallion from "./Medallion";
import { useLang } from "./LangProvider";
import { HTML_LANG, LANGS, LANG_COOKIE, LANG_COOKIE_MAX_AGE, splitPath, switchHref, type Lang } from "@/lib/i18n/config";

export const LANG_CHOSEN_EVENT = "bba:lang-chosen";

/** True once the visitor has picked (or dismissed) the language chooser. */
export function hasChosenLang() {
  try {
    return document.cookie.split("; ").some((c) => c.startsWith(`${LANG_COOKIE}=`));
  } catch {
    return true;
  }
}

function remember(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new Event(LANG_CHOSEN_EVENT));
}

const OPTIONS: Record<Lang, { name: string; hint: string }> = {
  en: { name: "English", hint: "" },
  hi: { name: "हिन्दी", hint: "Hindi" },
  hn: { name: "Hinglish", hint: "Hindi in English letters" },
};

/**
 * First visit only: asks which language to use. The choice is kept in a
 * cookie; from then on the proxy opens every page in that language.
 * Closing it keeps the language the visitor is reading in.
 */
export default function LangChooser() {
  const { lang, ui } = useLang();
  const { path } = splitPath(usePathname() ?? "/");
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (path.startsWith("/tools") || hasChosenLang()) return;
    // On the homepage, wait for the intro animation to finish.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = !reduced && (document.querySelector(".withload") && !document.documentElement.classList.contains("intro-seen")) ? 3700 : 400;
    const t = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(t);
  }, [path]);

  const close = useCallback(() => {
    remember(lang);
    setOpen(false);
  }, [lang]);

  // Modal: lock scroll, focus the first choice, Esc to close, keep Tab inside.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const els = () => Array.from(panel.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []);
    panel.current?.querySelector<HTMLElement>(".lc-option")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab") {
        const list = els();
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  const hash = typeof window !== "undefined" ? window.location.hash : "";

  return (
    <>
      <div className="lc-scrim" onClick={close} aria-hidden="true" />
      <div ref={panel} className="lc" role="dialog" aria-modal="true" aria-labelledby="lc-title">
        <button type="button" className="lc-close" onClick={close} aria-label={ui.common.close}>
          <span />
          <span />
        </button>
        <Medallion width={46} height={51} />
        <h2 id="lc-title" className="lc-title">
          <span lang="en-IN">Choose your language</span>
          <span lang="hi-IN">अपनी भाषा चुनें</span>
          <span lang="hi-Latn">Apni bhasha chunein</span>
        </h2>
        <div className="lc-options">
          {LANGS.map((l) => (
            <a
              key={l}
              className={`lc-option${l === lang ? " is-current" : ""}`}
              href={switchHref(l, path + hash)}
              rel="nofollow"
              lang={HTML_LANG[l]}
              hrefLang={HTML_LANG[l]}
              aria-current={l === lang ? "true" : undefined}
              onClick={(e) => {
                // Same language: just remember it, no reload. Otherwise the
                // link opens the page in that language and the proxy keeps it.
                if (l === lang) {
                  e.preventDefault();
                  close();
                } else remember(l);
              }}
            >
              <span className="lc-name">{OPTIONS[l].name}</span>
              {OPTIONS[l].hint && (
                <span className="lc-hint" lang="en-IN">
                  {OPTIONS[l].hint}
                </span>
              )}
              <span className="lc-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
        <p className="lc-note">{ui.common.langNote}</p>
      </div>
    </>
  );
}
