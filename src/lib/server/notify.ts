import "server-only";
import { orderByRazorpayId } from "./orders";
import { autoWhatsApp } from "./whatsapp";

/**
 * Customer messages after payment (WhatsApp, when connected). Never throws:
 * a message failing must not affect the order.
 */
export async function notifyCustomerPaid(razorpayOrderId: string) {
  try {
    const o = await orderByRazorpayId(razorpayOrderId);
    if (!o || o.status !== "paid") return;
    await autoWhatsApp("paid", o);
  } catch (e) {
    console.error("[notify] paid", e instanceof Error ? e.message : e);
  }
}
