"use client";

import { Fragment } from "react";
import Link from "./LocaleLink";

/**
 * Interface sentences with [link text](/path) inside, so translations can
 * move the links around. Site links stay in the visitor's language.
 */
export default function RichText({ text, newTab = false }: { text: string; newTab?: boolean }) {
  const out: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const href = m[2];
    const ext = newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
    out.push(
      href.startsWith("/") ? (
        <Link key={i++} href={href} {...ext}>
          {m[1]}
        </Link>
      ) : /^https?:\/\//.test(href) ? (
        <a key={i++} href={href} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      ) : (
        <Fragment key={i++}>{m[1]}</Fragment>
      ),
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}
