import { apiAdmin } from "@/lib/server/adminApi";
import { getOrder } from "@/lib/server/orders";
import { buildOrderPdf } from "@/lib/server/orderPdf";
import { logAction } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiAdmin(req, "editor", false);
  if (user instanceof Response) return user;
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const o = await getOrder(id);
  if (!o) return new Response("Not found", { status: 404 });
  const pdf = await buildOrderPdf(o);
  await logAction(user.id, "order.pdf", id);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BBA-order-${o.ref}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
