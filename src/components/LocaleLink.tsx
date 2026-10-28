"use client";

import Link from "next/link";
import { useContext, type ComponentProps } from "react";
import { lp } from "@/lib/i18n/config";
import { LangCtx } from "./LangProvider";

/** next/link that keeps the visitor in their language (/bracelets → /hi/bracelets). */
export default function LocaleLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const lang = useContext(LangCtx)?.lang;
  const h = typeof href === "string" && lang ? lp(lang, href) : href;
  return <Link href={h} {...rest} />;
}
