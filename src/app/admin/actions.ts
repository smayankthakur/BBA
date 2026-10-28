"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearLoginFailures,
  createInvite,
  endSession,
  findInvite,
  getDummyHash,
  hashPassword,
  logAction,
  loginBlocked,
  normEmail,
  passwordProblem,
  recordLoginFailure,
  requireAdmin,
  startSession,
  validEmail,
  verifyPassword,
  type Role,
} from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { ensureSchema } from "@/lib/server/schema";
import {
  NEW_VISUAL,
  adminGetProduct,
  getBracelets,
  createProduct,
  deleteProductForever,
  setProductStatus,
  slugTaken,
  updateProduct,
} from "@/lib/server/catalog";
import { resetContent, saveContent } from "@/lib/server/content";
import { FULFILMENT, updateOrderAdmin, type Fulfilment } from "@/lib/server/orders";
import { deleteMedia } from "@/lib/server/media";
import { codeTaken, deleteCoupon, getCoupon, saveCoupon, setCouponActive } from "@/lib/server/coupons";
import { COUPON_RE, normCode } from "@/lib/coupon-types";
import { PARTNER_CODE_RE, addPayout, codeInUse, deletePartner, deletePayout, getPartner, savePartner } from "@/lib/server/partners";
import { pageDef } from "@/lib/content/fields";
import type { PageId } from "@/lib/content/defaults";
import { PRODUCT_TEXT_KEYS, SLUG_RE, type Product, type ProductI18n, type ProductKind, type ProductStatus, type Visual } from "@/lib/catalog-types";
import { safeHref } from "@/lib/content/render";

const str = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);
function go(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params)}`);
}
/** Public pages are rebuilt on their next visit after any content change. */
const refreshSite = () => revalidatePath("/", "layout");

/* ------------------------------------------------------------------ */
/* Sign in, register, sign out                                          */
/* ------------------------------------------------------------------ */

export async function loginAction(fd: FormData) {
  await ensureSchema();
  const email = normEmail(str(fd, "email", 200));
  const password = String(fd.get("password") ?? "").slice(0, 200);
  if (!email || !password) go("/admin/login", { err: "missing" });
  if (await loginBlocked(email)) go("/admin/login", { err: "locked" });

  const rows = await sql<{ id: string; password_hash: string; disabled: boolean }>`select id, password_hash, disabled from admin_users where email = ${email}`;
  const user = rows[0];
  const ok = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));
  if (!user || !ok || user.disabled) {
    await recordLoginFailure(email);
    go("/admin/login", { err: "bad" });
  }
  await clearLoginFailures(email);
  await startSession(user.id);
  await logAction(user.id, "login");
  redirect("/admin");
}

export async function registerAction(fd: FormData) {
  await ensureSchema();
  const name = str(fd, "name", 80);
  const password = String(fd.get("password") ?? "").slice(0, 200);
  const confirm = String(fd.get("confirm") ?? "").slice(0, 200);
  const inviteToken = str(fd, "invite", 100);
  const back: (err: string) => never = (err) => go("/admin/register", inviteToken ? { invite: inviteToken, err } : { err });

  if (!name) back("name");
  const problem = passwordProblem(password);
  if (problem) back("weak");
  if (password !== confirm) back("mismatch");

  const hash = await hashPassword(password);
  let userId: string | undefined;

  if (inviteToken) {
    const invite = await findInvite(inviteToken);
    if (!invite) back("invite");
    const exists = await sql`select 1 from admin_users where email = ${invite.email}`;
    if (exists.length) back("taken");
    const used = await sql<{ id: string }>`update admin_invites set used_at = now() where id = ${invite.id} and used_at is null returning id`;
    if (!used.length) back("invite");
    const rows = await sql<{ id: string }>`insert into admin_users (email, name, password_hash, role)
      values (${invite.email}, ${name}, ${hash}, ${invite.role}) returning id`;
    userId = rows[0].id;
  } else {
    // Only the very first account can register without an invite; it becomes the owner.
    const email = normEmail(str(fd, "email", 200));
    if (!validEmail(email)) back("email");
    const rows = await sql<{ id: string }>`insert into admin_users (email, name, password_hash, role)
      select ${email}, ${name}, ${hash}, 'owner' where not exists (select 1 from admin_users) returning id`;
    if (!rows.length) go("/admin/register", { err: "closed" });
    userId = rows[0].id;
  }
  await startSession(userId!);
  await logAction(userId!, "register");
  redirect("/admin?welcome=1");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login?msg=out");
}

/* ------------------------------------------------------------------ */
/* Products                                                             */
/* ------------------------------------------------------------------ */

const lines = (v: FormDataEntryValue | null, maxItems = 30, maxLen = 600) =>
  String(v ?? "")
    .split("\n")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);

const COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\))$/;
const GRADIENT = /^linear-gradient\([\w\s#.,%()-]+\)$/;

function cleanVisual(raw: unknown, fallback: Visual): Visual {
  const v = (raw && typeof raw === "object" ? raw : {}) as Partial<Visual>;
  const col = (x: unknown, fb: string) => (typeof x === "string" && COLOR.test(x.trim()) ? x.trim() : fb);
  const grad = (x: unknown, fb: string) => (typeof x === "string" && (GRADIENT.test(x.trim()) || COLOR.test(x.trim())) ? x.trim() : fb);
  const trip = (x: unknown, fb: [string, string, string]) =>
    (Array.isArray(x) && x.length === 3 ? x.map((c, i) => col(c, fb[i])) : fb) as [string, string, string];
  return {
    sphere: col(v.sphere, fallback.sphere),
    sphereShade: col(v.sphereShade, fallback.sphereShade),
    sphereGloss: typeof v.sphereGloss === "number" && v.sphereGloss >= 0 && v.sphereGloss <= 1 ? v.sphereGloss : fallback.sphereGloss,
    cards: trip(v.cards, fallback.cards).map((c, i) => grad((v.cards ?? [])[i], fallback.cards[i]) || c) as [string, string, string],
    rings: [0, 1, 2].map((i) => trip((v.rings ?? [])[i], fallback.rings[i])) as Visual["rings"],
    gradient: grad(v.gradient, fallback.gradient ?? fallback.cards[0]),
    beads: trip(v.beads, fallback.beads ?? fallback.rings[0]),
  };
}

function cleanPhotos(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((x) => String(x).trim().slice(0, 500))
    .filter((u) => u && safeHref(u) && !u.startsWith("mailto:") && !u.startsWith("tel:"))
    .slice(0, 12);
}

/** Hindi/Hinglish product wording from the form: known fields only, trimmed and length-limited. */
function cleanI18n(raw: FormDataEntryValue | null): ProductI18n {
  let v: unknown;
  try {
    v = JSON.parse(String(raw ?? "{}"));
  } catch {
    return {};
  }
  const out: ProductI18n = {};
  const LIM: Record<string, number> = { title: 120, blurb: 400, note: 600, photoAlt: 200, videoTitle: 120, seoTitle: 120, seoDescription: 300 };
  for (const l of ["hi", "hn"] as const) {
    const t = (v && typeof v === "object" ? (v as Record<string, unknown>)[l] : null) as Record<string, unknown> | null;
    if (!t || typeof t !== "object") continue;
    const o: Record<string, unknown> = {};
    for (const k of PRODUCT_TEXT_KEYS) {
      const x = t[k];
      if (Array.isArray(x)) {
        const arr = x.map((y) => String(y).trim().slice(0, k === "intro" ? 1500 : 600)).filter(Boolean).slice(0, k === "intro" ? 8 : 30);
        if (arr.length) o[k] = arr;
      } else if (typeof x === "string" && x.trim()) o[k] = x.trim().slice(0, LIM[k] ?? 300);
    }
    if (Object.keys(o).length) out[l] = o;
  }
  return out;
}

export async function saveProductAction(fd: FormData) {
  const user = await requireAdmin("editor");
  const id = str(fd, "id", 40);
  const kind = (str(fd, "kind", 10) === "gift" ? "gift" : "bracelet") as ProductKind;
  const back: (err: string) => never = (err) => go(id ? `/admin/products/${id}` : "/admin/products/new", { err, kind });

  const title = str(fd, "title", 120);
  const slug = str(fd, "slug", 80).toLowerCase();
  if (!title) back("title");
  if (!SLUG_RE.test(slug)) back("slug");
  if (await slugTaken(kind, slug, id || undefined)) back("slugTaken");

  const price = Math.round(Number(str(fd, "price", 10)));
  if (!Number.isFinite(price) || price < 1 || price > 1_000_000) back("price");

  const existing = id ? await adminGetProduct(id) : null;
  if (id && !existing) go("/admin/products", { err: "missing" });

  let visualRaw: unknown = null;
  let photosRaw: unknown = null;
  try {
    visualRaw = JSON.parse(String(fd.get("visual") ?? "null"));
    photosRaw = JSON.parse(String(fd.get("photos") ?? "[]"));
  } catch {
    back("data");
  }
  const statusIn = str(fd, "status", 12);
  const status: ProductStatus = statusIn === "draft" ? "draft" : "published";
  const videoRaw = str(fd, "videoId", 200);
  const videoId = (/(?:shorts\/|v=|youtu\.be\/|embed\/)([\w-]{6,20})/.exec(videoRaw)?.[1] ?? (/^[\w-]{6,20}$/.test(videoRaw) ? videoRaw : "")) || null;

  const p: Omit<Product, "id"> = {
    kind,
    slug,
    title,
    blurb: str(fd, "blurb", 400),
    intro: String(fd.get("intro") ?? "")
      .split(/\n\s*\n/)
      .map((x) => x.replace(/\s*\n\s*/g, " ").trim().slice(0, 1500))
      .filter(Boolean)
      .slice(0, 8),
    listA: lines(fd.get("listA")),
    listB: lines(fd.get("listB")),
    crystals: lines(fd.get("crystals"), 20, 60),
    note: str(fd, "note", 600) || null,
    priceInr: price,
    sort: Math.max(0, Math.min(100000, Math.round(Number(str(fd, "sort", 6)) || 0))),
    status,
    inList: fd.get("inList") === "on",
    photos: cleanPhotos(photosRaw),
    photoAlt: str(fd, "photoAlt", 200) || null,
    videoId,
    videoTitle: str(fd, "videoTitle", 120) || null,
    visual: cleanVisual(visualRaw, existing?.visual ?? NEW_VISUAL),
    seoTitle: str(fd, "seoTitle", 120) || null,
    seoDescription: str(fd, "seoDescription", 300) || null,
    i18n: cleanI18n(fd.get("i18n")),
  };

  let savedId = id;
  if (id) await updateProduct(id, p);
  else {
    savedId = (await createProduct(p)) ?? "";
    if (!savedId) back("slugTaken");
  }
  await logAction(user.id, id ? "product.update" : "product.create", `${kind}:${slug}`);
  refreshSite();
  go(`/admin/products/${savedId}`, { msg: id ? "saved" : "created" });
}

export async function productStatusAction(fd: FormData) {
  const user = await requireAdmin("editor");
  const id = str(fd, "id", 40);
  const to = str(fd, "to", 12);
  const p = await adminGetProduct(id);
  if (!p) go("/admin/products", { err: "missing" });
  if (to === "trash" || to === "published" || to === "draft") {
    await setProductStatus(id, to);
    await logAction(user.id, `product.${to}`, `${p!.kind}:${p!.slug}`);
  } else if (to === "delete") {
    if (p!.status !== "trash") go("/admin/products", { err: "notTrash" });
    await deleteProductForever(id);
    await logAction(user.id, "product.delete", `${p!.kind}:${p!.slug}`);
  }
  refreshSite();
  go("/admin/products", { msg: to, kind: p!.kind, ...(to === "delete" || to === "published" ? { status: "trash" } : {}) });
}

/* ------------------------------------------------------------------ */
/* Pages and settings                                                   */
/* ------------------------------------------------------------------ */

export async function saveContentAction(fd: FormData) {
  const user = await requireAdmin("editor");
  const id = str(fd, "id", 40) as PageId;
  const lang = (["hi", "hn"].includes(str(fd, "lang", 4)) ? str(fd, "lang", 4) : "en") as "en" | "hi" | "hn";
  const back = (q: Record<string, string>) => go(`/admin/pages/${id}`, lang === "en" ? q : { ...q, lang });
  if (!pageDef(id)) go("/admin/pages", { err: "missing" });
  if (id === "settings") await requireAdmin("admin");
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(String(fd.get("data") ?? "{}"));
  } catch {
    back({ err: "data" });
  }
  await saveContent(id, data!, user.id, lang);
  await logAction(user.id, "content.save", lang === "en" ? id : `${id}@${lang}`);
  refreshSite();
  back({ msg: "saved" });
}

export async function resetContentAction(fd: FormData) {
  const user = await requireAdmin("admin");
  const id = str(fd, "id", 40) as PageId;
  const lang = (["hi", "hn"].includes(str(fd, "lang", 4)) ? str(fd, "lang", 4) : "en") as "en" | "hi" | "hn";
  const back = (q: Record<string, string>) => go(`/admin/pages/${id}`, lang === "en" ? q : { ...q, lang });
  if (!pageDef(id)) go("/admin/pages", { err: "missing" });
  if (fd.get("confirm") !== "yes") back({ err: "confirm" });
  await resetContent(id, lang);
  await logAction(user.id, "content.reset", lang === "en" ? id : `${id}@${lang}`);
  refreshSite();
  back({ msg: "reset" });
}

/* ------------------------------------------------------------------ */
/* Orders                                                               */
/* ------------------------------------------------------------------ */

export async function updateOrderAction(fd: FormData) {
  const user = await requireAdmin("editor");
  const id = str(fd, "id", 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) go("/admin/orders", { err: "missing" });
  const f = str(fd, "fulfilment_status", 20) as Fulfilment;
  if (!FULFILMENT.includes(f)) go(`/admin/orders/${id}`, { err: "status" });
  await updateOrderAdmin(id, {
    fulfilment_status: f,
    courier: str(fd, "courier", 80) || null,
    tracking_number: str(fd, "tracking_number", 80) || null,
    admin_notes: str(fd, "admin_notes", 3000) || null,
  });
  await logAction(user.id, "order.update", id);
  go(`/admin/orders/${id}`, { msg: "saved" });
}

/* ------------------------------------------------------------------ */
/* Media                                                                */
/* ------------------------------------------------------------------ */

export async function deleteMediaAction(fd: FormData) {
  const user = await requireAdmin("editor");
  const id = str(fd, "id", 40);
  const result = await deleteMedia(id);
  await logAction(user.id, "media.delete", id);
  go("/admin/media", result === "in-use" ? { err: "inUse" } : { msg: "deleted" });
}

/* ------------------------------------------------------------------ */
/* Users                                                                */
/* ------------------------------------------------------------------ */

export async function inviteAction(fd: FormData) {
  const user = await requireAdmin("owner");
  const email = normEmail(str(fd, "email", 200));
  const role = (str(fd, "role", 10) === "admin" ? "admin" : "editor") as "admin" | "editor";
  if (!validEmail(email)) go("/admin/users", { err: "email" });
  const exists = await sql`select 1 from admin_users where email = ${email}`;
  if (exists.length) go("/admin/users", { err: "taken" });
  const token = await createInvite(email, role, user.id);
  await logAction(user.id, "user.invite", email);
  // The link is shown once, on the next page load only.
  go("/admin/users", { invite: token, for: email });
}

export async function revokeInviteAction(fd: FormData) {
  const user = await requireAdmin("owner");
  const id = str(fd, "id", 80);
  await sql`delete from admin_invites where id = ${id} and used_at is null`;
  await logAction(user.id, "invite.revoke");
  go("/admin/users", { msg: "revoked" });
}

export async function userAction(fd: FormData) {
  const me = await requireAdmin("owner");
  const id = str(fd, "id", 40);
  const op = str(fd, "op", 20);
  if (id === me.id) go("/admin/users", { err: "self" });
  const rows = await sql<{ role: Role }>`select role from admin_users where id = ${id}`;
  if (!rows.length || rows[0].role === "owner") go("/admin/users", { err: "owner" });
  if (op === "disable" || op === "enable") {
    await sql`update admin_users set disabled = ${op === "disable"} where id = ${id}`;
    if (op === "disable") await sql`delete from admin_sessions where user_id = ${id}`;
  } else if (op === "admin" || op === "editor") {
    await sql`update admin_users set role = ${op} where id = ${id}`;
  } else if (op === "delete") {
    await sql`delete from admin_users where id = ${id}`;
  }
  await logAction(me.id, `user.${op}`, id);
  go("/admin/users", { msg: "updated" });
}

export async function accountAction(fd: FormData) {
  const me = await requireAdmin("editor");
  const name = str(fd, "name", 80);
  const current = String(fd.get("current") ?? "").slice(0, 200);
  const next = String(fd.get("password") ?? "").slice(0, 200);
  const confirm = String(fd.get("confirm") ?? "").slice(0, 200);
  if (name) await sql`update admin_users set name = ${name} where id = ${me.id}`;
  if (next) {
    const rows = await sql<{ password_hash: string }>`select password_hash from admin_users where id = ${me.id}`;
    if (!(await verifyPassword(current, rows[0].password_hash))) go("/admin/account", { err: "current" });
    if (passwordProblem(next)) go("/admin/account", { err: "weak" });
    if (next !== confirm) go("/admin/account", { err: "mismatch" });
    await sql`update admin_users set password_hash = ${await hashPassword(next)} where id = ${me.id}`;
    // Sign out every other device.
    await sql`delete from admin_sessions where user_id = ${me.id}`;
    await startSession(me.id);
    await logAction(me.id, "password.change");
  }
  go("/admin/account", { msg: "saved" });
}

export async function signOutEverywhereAction() {
  const me = await requireAdmin("editor");
  await sql`delete from admin_sessions where user_id = ${me.id}`;
  await endSession();
  redirect("/admin/login?msg=out");
}

/* ------------------------------------------------------------------ */
/* Coupons                                                              */
/* ------------------------------------------------------------------ */

const optInt = (fd: FormData, k: string): number | null | "bad" => {
  const v = str(fd, k, 10);
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 10_000_000 ? n : "bad";
};
/** Dates are picked in India time: a coupon starts at 00:00 and ends at 23:59:59 IST. */
const istDate = (fd: FormData, k: string, end: boolean) => {
  const v = str(fd, k, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T${end ? "23:59:59" : "00:00:00"}+05:30`).toISOString() : null;
};

export async function saveCouponAction(fd: FormData) {
  const user = await requireAdmin("admin");
  const id = str(fd, "id", 40) || null;
  const back: (err: string) => never = (err) => go(id ? `/admin/coupons/${id}` : "/admin/coupons/new", { err });
  if (id && !(await getCoupon(id))) go("/admin/coupons", { err: "missing" });

  const code = normCode(str(fd, "code", 40));
  if (!COUPON_RE.test(code)) back("code");
  if (await codeTaken(code, id ?? undefined)) back("codeTaken");
  const kind = str(fd, "kind", 10) === "flat" ? "flat" : "percent";
  const value = Math.round(Number(str(fd, "value", 10)));
  if (!Number.isFinite(value) || value < 1 || (kind === "percent" ? value > 90 : value > 1_000_000)) back("value");
  const maxDiscount = optInt(fd, "maxDiscountInr");
  const usageLimit = optInt(fd, "usageLimit");
  const perCustomer = optInt(fd, "perCustomerLimit");
  if (maxDiscount === "bad" || usageLimit === "bad" || perCustomer === "bad") back("limits");
  const minOrder = Math.max(0, Math.min(1_000_000, Math.round(Number(str(fd, "minOrderInr", 10)) || 0)));
  const startsAt = istDate(fd, "startsAt", false);
  const endsAt = istDate(fd, "endsAt", true);
  if (startsAt && endsAt && endsAt < startsAt) back("dates");
  const valid = new Set((await getBracelets()).map((b) => b.slug));
  const products = fd
    .getAll("products")
    .map(String)
    .filter((s) => valid.has(s))
    .slice(0, 50);

  const savedId = await saveCoupon(
    id,
    {
      code,
      description: str(fd, "description", 200),
      kind,
      value,
      maxDiscountInr: kind === "percent" ? (maxDiscount as number | null) : null,
      minOrderInr: minOrder,
      startsAt,
      endsAt,
      usageLimit: usageLimit as number | null,
      perCustomerLimit: perCustomer as number | null,
      products,
      active: fd.get("active") === "on",
    },
    user.id,
  );
  if (!savedId) back("codeTaken");
  await logAction(user.id, id ? "coupon.update" : "coupon.create", code);
  go(`/admin/coupons/${savedId}`, { msg: id ? "saved" : "created" });
}

export async function couponAction(fd: FormData) {
  const user = await requireAdmin("admin");
  const id = str(fd, "id", 40);
  const op = str(fd, "op", 10);
  const c = await getCoupon(id);
  if (!c) go("/admin/coupons", { err: "missing" });
  if (op === "on" || op === "off") await setCouponActive(id, op === "on");
  else if (op === "delete") await deleteCoupon(id);
  else go("/admin/coupons", { err: "missing" });
  await logAction(user.id, `coupon.${op}`, c!.code);
  go("/admin/coupons", { msg: op === "delete" ? "deleted" : op });
}

/* ------------------------------------------------------------------ */
/* Partners                                                             */
/* ------------------------------------------------------------------ */

export async function savePartnerAction(fd: FormData) {
  const user = await requireAdmin("admin");
  const id = str(fd, "id", 40) || null;
  const back: (err: string) => never = (err) => go(id ? `/admin/partners/${id}` : "/admin/partners/new", { err });
  if (id && !(await getPartner(id))) go("/admin/partners", { err: "missing" });
  const name = str(fd, "name", 100);
  if (!name) back("name");
  const code = str(fd, "code", 40).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!PARTNER_CODE_RE.test(code)) back("pcode");
  if (await codeInUse(code, id ?? undefined)) back("pcodeTaken");
  const kind = str(fd, "kind", 10) === "flat" ? "flat" : "percent";
  const rate = Math.round(Number(str(fd, "rate", 10)));
  if (!Number.isFinite(rate) || rate < 0 || (kind === "percent" ? rate > 90 : rate > 100000)) back("rate");
  const email = str(fd, "email", 200);
  if (email && !validEmail(email)) back("email");
  const saved = await savePartner(id, {
    code,
    name,
    phone: str(fd, "phone", 20).replace(/[^\d+ ]/g, ""),
    email,
    kind,
    rate,
    notes: str(fd, "notes", 1000),
    active: fd.get("active") === "on",
  });
  if (!saved) back("pcodeTaken");
  await logAction(user.id, id ? "partner.update" : "partner.create", code);
  go(`/admin/partners/${saved}`, { msg: id ? "saved" : "created" });
}

export async function partnerAction(fd: FormData) {
  const user = await requireAdmin("admin");
  const id = str(fd, "id", 40);
  const op = str(fd, "op", 10);
  const p = await getPartner(id);
  if (!p) go("/admin/partners", { err: "missing" });
  if (op === "on" || op === "off") {
    await savePartner(id, { ...p!, active: op === "on" });
  } else if (op === "delete") {
    await deletePartner(id);
  } else go("/admin/partners", { err: "missing" });
  await logAction(user.id, `partner.${op}`, p!.code);
  go("/admin/partners", { msg: op === "delete" ? "deleted" : op === "on" ? "pon" : "poff" });
}

export async function addPayoutAction(fd: FormData) {
  const user = await requireAdmin("admin");
  const id = str(fd, "id", 40);
  const p = await getPartner(id);
  if (!p) go("/admin/partners", { err: "missing" });
  const amount = Math.round(Number(str(fd, "amount", 12)) * 100);
  const paidOn = str(fd, "paidOn", 10);
  if (!Number.isFinite(amount) || amount < 100 || amount > 100_000_000) go(`/admin/partners/${id}`, { err: "amount" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) go(`/admin/partners/${id}`, { err: "paidOn" });
  await addPayout(id, amount, paidOn, str(fd, "reference", 120), str(fd, "note", 300), user.id);
  await logAction(user.id, "partner.payout", `${p!.code}:${amount / 100}`);
  go(`/admin/partners/${id}`, { msg: "payout" });
}

export async function deletePayoutAction(fd: FormData) {
  const user = await requireAdmin("admin");
  const id = str(fd, "id", 40);
  const payout = str(fd, "payout", 40);
  if (/^[0-9a-f-]{36}$/i.test(payout)) await deletePayout(payout);
  await logAction(user.id, "partner.payout.delete", payout);
  go(`/admin/partners/${id}`, { msg: "deleted" });
}
