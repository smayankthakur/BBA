import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import ArticleForm from "@/components/admin/ArticleForm";
import { requireAdmin } from "@/lib/server/auth";
import { getBracelets } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticle({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("editor");
  const purposes = (await getBracelets()).filter((b) => b.inList).map((b) => ({ slug: b.slug, title: b.title }));
  return (
    <>
      <div className="ad-head">
        <h1>New article</h1>
      </div>
      <p className="ad-sub">
        <Link href="/admin/articles">← All articles</Link> · Write it in English first; Hindi and Hinglish tabs appear after you save.
      </p>
      <Notice sp={sp} />
      <ArticleForm a={null} purposes={purposes} />
    </>
  );
}
