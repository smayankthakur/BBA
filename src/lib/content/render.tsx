import Link from "next/link";
import type { ReactNode } from "react";

export { fill } from "./fill";

/** Only allow site-relative links, http(s), mailto and tel. Anything else becomes plain text. */
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^\/(?!\/)/.test(h) || /^#[\w-]+$/.test(h)) return h;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(h)) return h;
  return null;
}

/** **bold**, *italic*, [text](link) — React elements only, so no HTML can be injected. */
function inline(s: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[1] !== undefined) out.push(<b key={k}>{inline(m[1], k)}</b>);
    else if (m[2] !== undefined) out.push(<em key={k}>{inline(m[2], k)}</em>);
    else {
      const href = safeHref(m[4]);
      if (!href) out.push(m[3]);
      else if (href.startsWith("/") || href.startsWith("#")) out.push(<Link key={k} href={href}>{m[3]}</Link>);
      else
        out.push(
          <a key={k} href={href} {...(/^https?:/i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {m[3]}
          </a>,
        );
    }
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function Inline({ text }: { text: string }) {
  return <>{inline(text, "i")}</>;
}

/**
 * A small, safe Markdown renderer for admin-written text:
 * ## / ### headings, paragraphs, - bullets, 1. numbered lists, **bold**, *italic*, [links](/x).
 * `blocks` lets a page insert its own elements where a line says {{name}}.
 */
export function Markdown({ text, blocks = {} }: { text: string; blocks?: Record<string, ReactNode> }) {
  const lines = String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let n = 0;

  const flushPara = () => {
    if (para.length) out.push(<p key={`p${n++}`}>{inline(para.join(" "), `p${n}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, j) => <li key={j}>{inline(it, `l${n}-${j}`)}</li>);
    out.push(list.ordered ? <ol key={`l${n++}`}>{items}</ol> : <ul key={`l${n++}`}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const block = /^\{\{(\w+)\}\}$/.exec(line);
    if (!line) {
      flushPara();
      flushList();
    } else if (block && blocks[block[1]] !== undefined) {
      flushPara();
      flushList();
      out.push(<div key={`b${n++}`}>{blocks[block[1]]}</div>);
    } else if (/^###\s+/.test(line)) {
      flushPara();
      flushList();
      out.push(<h3 key={`h${n++}`}>{inline(line.replace(/^###\s+/, ""), `h${n}`)}</h3>);
    } else if (/^##\s+/.test(line)) {
      flushPara();
      flushList();
      out.push(<h2 key={`h${n++}`}>{inline(line.replace(/^##\s+/, ""), `h${n}`)}</h2>);
    } else if (/^[-*]\s+/.test(line)) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^\d+[.)]\s+/.test(line)) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(line.replace(/^\d+[.)]\s+/, ""));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return <>{out}</>;
}
