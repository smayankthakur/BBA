import type { Metadata } from "next";
import Notice from "@/components/admin/Notice";
import CouponForm from "@/components/admin/CouponForm";
import { requireAdmin } from "@/lib/server/auth";
import { getBracelets } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Add coupon" };

export default async function NewCoupon({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("admin");
  const bracelets = await getBracelets();
  return (
    <>
      <div className="ad-head">
        <h1>Add a coupon</h1>
      </div>
      <Notice sp={sp} />
      <CouponForm coupon={null} bracelets={bracelets} />
    </>
  );
}
