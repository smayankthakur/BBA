import type { Metadata } from "next";
import Notice from "@/components/admin/Notice";
import PartnerForm from "@/components/admin/PartnerForm";
import { requireAdmin } from "@/lib/server/auth";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Add partner" };

export default async function NewPartner({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("admin");
  return (
    <>
      <div className="ad-head">
        <h1>Add a partner</h1>
      </div>
      <Notice sp={sp} />
      <PartnerForm partner={null} siteUrl={SITE_URL} />
    </>
  );
}
