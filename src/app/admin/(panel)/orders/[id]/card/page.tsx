import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReadingCard from "@/components/ReadingCard";
import PrintButton from "@/components/admin/PrintButton";
import { requireAdmin } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/orders";

export const metadata: Metadata = { title: "Reading card" };

/** The reading card for one order, with the crystals Ammit chose. Print it for the box or save as PDF. */
export default async function OrderCard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("editor");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const o = await getOrder(id);
  if (!o) notFound();
  const [y, m, d] = (o.dob_text ?? "").split("-").map(Number);
  const dob = o.dob_text
    ? `${d} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][m - 1]} ${y}`
    : "—";
  return (
    <>
      <div className="ad-head no-print">
        <h1>Reading card · {o.ref}</h1>
        <PrintButton />
      </div>
      <p className="ad-sub no-print">
        <Link href={`/admin/orders/${o.id}`}>← Order</Link> · <Link href="/admin/reading">Reading queue</Link>
        {!o.crystals_chosen && " · No crystals chosen yet: add them in the reading queue first."}
      </p>
      <div className="print-area rq-print">
        <ReadingCard
          d={{
            name: `${o.wearer_first_name} ${o.wearer_last_name}`.trim(),
            dob,
            mulank: o.mulank ?? 0,
            bhagyank: o.bhagyank ?? 0,
            bracelet: o.bracelet_title,
            crystals: (o.crystals_chosen ?? "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean),
            note: o.reading_notes ?? undefined,
            kind: "chosen",
          }}
        />
      </div>
    </>
  );
}
