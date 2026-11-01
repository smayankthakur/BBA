import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import { requireAdmin } from "@/lib/server/auth";
import { boardOrders, type AdminOrder } from "@/lib/server/orders";
import { bulkStatusAction } from "@/app/admin/actions";
import { PROGRESS } from "@/lib/orderProgress";

export const metadata: Metadata = { title: "Order board" };

const COLS = ["new", "reading", "making", "shipped", "delivered"] as const;
const NEXT: Record<string, string> = { new: "reading", reading: "making", making: "shipped", shipped: "delivered" };
const age = (d: string | Date | null) => {
  if (!d) return "";
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
};

function Card({ o }: { o: AdminOrder }) {
  const missing = !o.dob_text || !o.pincode;
  return (
    <li className="ad-card">
      <label className="ad-card-tick">
        <input type="checkbox" name="ids" value={o.id} form="board-bulk" aria-label={`Select ${o.ref}`} />
      </label>
      <Link className="ad-card-main" href={`/admin/orders/${o.id}`}>
        <b>{o.ref}</b> <span className="ad-muted">· {age(o.paid_at)}</span>
        <span>
          {o.wearer_first_name} {o.wearer_last_name}
        </span>
        <span className="ad-muted">{o.bracelet_title}</span>
        {missing && <span className="ad-pill warn">details missing</span>}
        {o.fulfilment_status === "shipped" && o.tracking_number && <span className="ad-muted">{o.courier} · {o.tracking_number}</span>}
      </Link>
      {NEXT[o.fulfilment_status] && (
        <form action={bulkStatusAction}>
          <input type="hidden" name="ids" value={o.id} />
          <input type="hidden" name="to" value={NEXT[o.fulfilment_status]} />
          <input type="hidden" name="back" value="/admin/orders/board" />
          <button className="ad-btn is-small" type="submit" aria-label={`Move ${o.ref} to ${PROGRESS[NEXT[o.fulfilment_status]]}`}>
            → {PROGRESS[NEXT[o.fulfilment_status]]}
          </button>
        </form>
      )}
    </li>
  );
}

/** Paid orders by progress step. Phones: swipe between columns. */
export default async function BoardPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin();
  const orders = await boardOrders();
  return (
    <>
      <div className="ad-head">
        <h1>Order board</h1>
        <Link className="ad-btn" href="/admin/orders">
          List view
        </Link>
      </div>
      <p className="ad-sub">Paid orders by step (delivered: last 7 days). Tap → to move an order on, or tick several and move them together.</p>
      <Notice sp={sp} />
      <form action={bulkStatusAction} id="board-bulk" className="ad-bulk">
        <input type="hidden" name="back" value="/admin/orders/board" />
        <label>
          <span>Move ticked orders to</span>
          <select name="to" defaultValue="making">
            {[...COLS, "cancelled"].map((f) => (
              <option key={f} value={f}>
                {PROGRESS[f]}
              </option>
            ))}
          </select>
        </label>
        <button className="ad-btn" type="submit">
          Move
        </button>
      </form>
      <div className="ad-board">
        {COLS.map((c) => {
          const list = orders.filter((o) => o.fulfilment_status === c);
          return (
            <section key={c} className="ad-col" aria-labelledby={`col-${c}`}>
              <h2 id={`col-${c}`}>
                {PROGRESS[c]} <span className="ad-count">{list.length}</span>
              </h2>
              {list.length === 0 ? (
                <p className="ad-muted">Nothing here.</p>
              ) : (
                <ul>
                  {list.map((o) => (
                    <Card key={o.id} o={o} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
