import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Notice from "@/components/admin/Notice";
import CouponForm from "@/components/admin/CouponForm";
import { requireAdmin } from "@/lib/server/auth";
import { getBracelets } from "@/lib/server/catalog";
import { getCoupon } from "@/lib/server/coupons";
import { SITE_URL } from "@/lib/site";
import CopyField from "@/components/admin/CopyField";

export const metadata: Metadata = { title: "Edit coupon" };

export default async function EditCoupon({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await requireAdmin("admin");
  const [c, bracelets] = await Promise.all([getCoupon(id), getBracelets()]);
  if (!c) notFound();
  return (
    <>
      <div className="ad-head">
        <h1>Coupon {c.code}</h1>
        <Link className="ad-btn" href="/admin/coupons/new">
          Add new
        </Link>
      </div>
      <Notice sp={sp} />
      <section className="ad-box" style={{ maxWidth: 760 }}>
        <h2>Offer link</h2>
        <div className="ad-box-body">
          <p className="ad-help">Share this on WhatsApp or Instagram. The code is filled in and applied at checkout automatically.</p>
          <CopyField value={`${SITE_URL}/find-your-bracelet?coupon=${encodeURIComponent(c.code)}`} label="Offer link" />
        </div>
      </section>
      <CouponForm key={c.code + c.active} coupon={c} bracelets={bracelets} />
    </>
  );
}
