import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { StoredOrder } from "./orders";


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Indian date-time, e.g. "25 Oct 2026, 10:42 AM IST". */
export function istDateTime(v: string | Date | null | undefined) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d) + " IST"
  );
}

export function dobLabel(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function ageOn(ymd: string, at = new Date()) {
  const [y, m, d] = ymd.split("-").map(Number);
  let age = at.getFullYear() - y;
  if (at.getMonth() + 1 < m || (at.getMonth() + 1 === m && at.getDate() < d)) age -= 1;
  return age;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const intentionName = (slug: string) => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const METHOD: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Net banking", wallet: "Wallet", emi: "EMI" };

/** All the details staff need for one order, as label/value rows grouped in sections. */
export function orderSections(o: StoredOrder): { title: string; rows: [string, string][] }[] {
  const wearer = `${o.wearer_first_name} ${o.wearer_last_name}`.trim();
  const utm = Object.entries(o.utm ?? {}).map(([k, v]) => `${k}=${v}`).join(", ");
  return [
    {
      title: "Order",
      rows: [
        ["Order number", o.ref],
        ["Status", "PAID"],
        ["Amount", `Rs. ${(o.amount_paise / 100).toLocaleString("en-IN")} (free shipping)`],
        ...((o.upgrade_paise ?? 0) > 0
          ? ([
              ["Added after payment", `Rs. ${((o.upgrade_paise ?? 0) / 100).toLocaleString("en-IN")} (extra purpose top-up)`],
              ["Total paid", `Rs. ${((o.amount_paise + (o.upgrade_paise ?? 0)) / 100).toLocaleString("en-IN")}`],
            ] as [string, string][])
          : []),
        ...(o.coupon_code
          ? ([["Coupon", `${o.coupon_code}: Rs. ${((o.discount_paise ?? 0) / 100).toLocaleString("en-IN")} off Rs. ${((o.amount_paise + (o.discount_paise ?? 0)) / 100).toLocaleString("en-IN")}`]] as [string, string][])
          : []),
        ["Paid on", istDateTime(o.paid_at)],
        ["Payment method", o.payment_method ? (METHOD[o.payment_method] ?? cap(o.payment_method)) : "-"],
        ["Razorpay payment ID", o.razorpay_payment_id ?? "-"],
        ["Razorpay order ID", o.razorpay_order_id],
      ],
    },
    {
      title: (o.upgrade_paise ?? 0) > 0 ? "Bracelet (UPDATED: purpose added after payment)" : "Bracelet",
      rows: [
        ["Purposes in this bracelet", `${o.bracelet_title} (${(o.purposes?.length || 1)} of 3)`],
        ["Intentions chosen", o.intentions?.length ? o.intentions.map(intentionName).join(", ") : "-"],
        ["What they want help with", o.focus || "-"],
      ],
    },
    {
      title: "Wearer (read the numbers for this person)",
      rows: [
        ["Name", wearer],
        ["Date of birth", `${dobLabel(o.dob_text)} (age ${ageOn(o.dob_text)})`],
        ["Gender", cap(o.wearer_gender)],
        ["Mulank / Bhagyank", `${o.mulank} / ${o.bhagyank}`],
        ["Wrist size", o.wrist === "unsure" ? "Not sure - confirm with customer" : o.wrist],
        ["Gift", o.is_gift ? "Yes" : "No"],
        ...(o.is_gift ? ([["Gift note (for the card)", o.gift_note || "-"]] as [string, string][]) : []),
      ],
    },
    {
      title: "Customer and delivery",
      rows: [
        ["Deliver to", o.delivery_name],
        ["Mobile", `+91 ${o.mobile}`],
        ["Email", o.email || "-"],
        ["Address", [o.address_line1, o.address_line2].filter(Boolean).join(", ")],
        ["Landmark", o.landmark || "-"],
        ["City / State / PIN", `${o.city}, ${o.state} ${o.pincode}`],
      ],
    },
    {
      title: "Consent and source",
      rows: [
        ["Terms accepted", istDateTime(o.terms_accepted_at)],
        ["WhatsApp offers", o.marketing_opt_in ? "Yes, opted in" : "No"],
        ["Order placed", istDateTime(o.created_at)],
        ["Campaign (UTM)", utm || "-"],
      ],
    },
  ];
}

/** The standard PDF fonts only cover Latin-1; replace anything else so the PDF always builds. */
function safe(font: PDFFont, s: string) {
  let out = "";
  for (const ch of s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out;
}

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const tryLine = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(tryLine, size) <= width) line = tryLine;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Builds the staff-only order sheet (A4). Never served to customers. */
export async function buildOrderPdf(o: StoredOrder): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Order ${o.ref} - Bracelet By Ammit (staff only)`);
  pdf.setAuthor("Bracelet By Ammit");
  pdf.setSubject("Staff-only order sheet");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const lapis = rgb(5 / 255, 14 / 255, 143 / 255);
  const gold = rgb(184 / 255, 145 / 255, 61 / 255);
  const ink = rgb(0.13, 0.15, 0.3);
  const soft = rgb(0.38, 0.4, 0.52);
  const W = 595.28;
  const H = 841.89;
  const M = 48;
  const labelW = 160;

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const header = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: H - 86, width: W, height: 86, color: lapis });
    p.drawText("Bracelet By Ammit", { x: M, y: H - 46, size: 22, font: serif, color: rgb(0.96, 0.93, 0.78) });
    p.drawText(safe(regular, `Order ${o.ref}`), { x: M, y: H - 68, size: 11, font: regular, color: rgb(0.86, 0.87, 0.96) });
    const tag = "STAFF ONLY - CONFIDENTIAL";
    p.drawText(tag, { x: W - M - bold.widthOfTextAtSize(tag, 9), y: H - 46, size: 9, font: bold, color: gold });
    y = H - 86 - 30;
  };
  header(page);

  const ensure = (needed: number) => {
    if (y - needed < M + 30) {
      page = pdf.addPage([W, H]);
      header(page);
    }
  };

  for (const section of orderSections(o)) {
    ensure(48);
    page.drawText(safe(bold, section.title.toUpperCase()), { x: M, y, size: 10, font: bold, color: gold });
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: gold });
    y -= 16;
    for (const [label, value] of section.rows) {
      const lines = wrap(bold, safe(regular, value), 10.5, W - M * 2 - labelW);
      ensure(lines.length * 13 + 4);
      page.drawText(safe(regular, label), { x: M, y, size: 9, font: regular, color: soft });
      lines.forEach((ln, i) => page.drawText(ln, { x: M + labelW, y: y - i * 13, size: 10.5, font: bold, color: ink }));
      y -= lines.length * 13 + 5;
    }
    y -= 10;
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const foot = `Contains customer personal data. Do not forward outside the Bracelet By Ammit team.  Page ${i + 1} of ${pages.length}`;
    p.drawText(foot, { x: M, y: 28, size: 8, font: regular, color: soft });
  });
  return pdf.save();
}
