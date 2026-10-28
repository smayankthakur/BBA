"use client";

import { createContext, useContext } from "react";
import type { Lang } from "@/lib/i18n/config";
import type { UI } from "@/lib/i18n/ui";

export const LangCtx = createContext<{ lang: Lang; ui: UI } | null>(null);

export function LangProvider({ lang, ui, children }: { lang: Lang; ui: UI; children: React.ReactNode }) {
  return <LangCtx.Provider value={{ lang, ui }}>{children}</LangCtx.Provider>;
}

/** Current language and its interface text, in client components. */
export function useLang() {
  const v = useContext(LangCtx);
  if (!v) throw new Error("useLang outside LangProvider");
  return v;
}
