import type { Metadata } from "next";
import Notice from "@/components/admin/Notice";
import ProductForm from "@/components/admin/ProductForm";
import { NEW_VISUAL } from "@/lib/server/catalog";
import { getContent } from "@/lib/server/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProduct({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const kind = sp.kind === "gift" ? "gift" : "bracelet";
  const s = await getContent("settings");
  return (
    <>
      <div className="ad-head">
        <h1>{kind === "gift" ? "Add a gift" : "Add a bracelet"}</h1>
      </div>
      <Notice sp={sp} />
      <ProductForm
        product={null}
        kind={kind}
        defaultPrice={s.defaultPrice}
        newVisual={NEW_VISUAL}
        siteUrl={SITE_URL}
      />
    </>
  );
}
