import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Notice from "@/components/admin/Notice";
import ProductForm from "@/components/admin/ProductForm";
import { NEW_VISUAL, adminGetProduct } from "@/lib/server/catalog";
import { getContent } from "@/lib/server/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [p, s] = await Promise.all([
    adminGetProduct(id),
    getContent("settings"),
  ]);
  if (!p || p.status === "trash") notFound();
  return (
    <>
      <div className="ad-head">
        <h1>Edit {p.kind === "gift" ? "gift" : "bracelet"}</h1>
        <Link className="ad-btn" href={`/admin/products/new?kind=${p.kind}`}>
          Add new
        </Link>
      </div>
      <Notice sp={sp} />
      <ProductForm
        key={p.updatedAt}
        product={p}
        kind={p.kind}
        defaultPrice={s.defaultPrice}
        newVisual={NEW_VISUAL}
        siteUrl={SITE_URL}
      />
    </>
  );
}
