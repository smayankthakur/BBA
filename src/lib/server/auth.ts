import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { dbConfigured, sql } from "./db";
import { ensureSchema } from "./schema";

/* ------------------------------------------------------------------ */
/* Passwords: scrypt with a per-user salt                               */
/* ------------------------------------------------------------------ */

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const N = 16384, R = 8, P = 1, LEN = 64;

export async function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, LEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [alg, n, r, p, saltB64, keyB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(pw, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

/** A hash to compare against when the email is unknown, so timing doesn't reveal which emails exist. */
let dummyHash: Promise<string> | null = null;
export const getDummyHash = () => (dummyHash ??= hashPassword(crypto.randomBytes(12).toString("hex")));

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 200) return "That password is too long.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Use both letters and numbers.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Sessions: random token in an httpOnly cookie, only its hash in the DB */
/* ------------------------------------------------------------------ */

export const COOKIE = "bba_admin";
const SESSION_DAYS = 7;
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export type Role = "owner" | "admin" | "editor";
export type AdminUser = { id: string; email: string; name: string; role: Role };

async function clientMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return { ip: ip.slice(0, 64), ua: (h.get("user-agent") ?? "").slice(0, 300) };
}

export async function startSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const { ip, ua } = await clientMeta();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await sql`insert into admin_sessions (id, user_id, expires_at, ip, user_agent) values (${sha256(token)}, ${userId}, ${expires.toISOString()}, ${ip}, ${ua})`;
  await sql`update admin_users set last_login_at = now() where id = ${userId}`;
  await sql`delete from admin_sessions where expires_at < now()`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && dbConfigured()) await sql`delete from admin_sessions where id = ${sha256(token)}`.catch(() => {});
  jar.delete(COOKIE);
}

/** The signed-in admin for this request, or null. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  if (!dbConfigured()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  await ensureSchema();
  const rows = await sql<AdminUser>`select u.id, u.email, u.name, u.role
    from admin_sessions s join admin_users u on u.id = s.user_id
    where s.id = ${sha256(token)} and s.expires_at > now() and not u.disabled`;
  return rows[0] ?? null;
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin(minRole: Role = "editor"): Promise<AdminUser> {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  if (!roleAtLeast(user.role, minRole)) redirect("/admin?denied=1");
  return user;
}

const RANK: Record<Role, number> = { editor: 1, admin: 2, owner: 3 };
export const roleAtLeast = (role: Role, min: Role) => RANK[role] >= RANK[min];

/* ------------------------------------------------------------------ */
/* Login rate limiting (stored in the DB so it works across instances) */
/* ------------------------------------------------------------------ */

const WINDOW_MIN = 15;
const MAX_TRIES = 8;

export async function loginBlocked(email: string) {
  const { ip } = await clientMeta();
  const keys = [`ip:${ip}`, `email:${email.toLowerCase()}`];
  const rows = await sql<{ key: string; count: number }>`select key, count from login_attempts
    where key = any(${keys}) and window_start > now() - make_interval(mins => ${WINDOW_MIN})`;
  return rows.some((r) => r.count >= MAX_TRIES);
}

export async function recordLoginFailure(email: string) {
  const { ip } = await clientMeta();
  for (const key of [`ip:${ip}`, `email:${email.toLowerCase()}`]) {
    await sql`insert into login_attempts (key, count, window_start) values (${key}, 1, now())
      on conflict (key) do update set
        count = case when login_attempts.window_start > now() - make_interval(mins => ${WINDOW_MIN}) then login_attempts.count + 1 else 1 end,
        window_start = case when login_attempts.window_start > now() - make_interval(mins => ${WINDOW_MIN}) then login_attempts.window_start else now() end`;
  }
}

export async function clearLoginFailures(email: string) {
  await sql`delete from login_attempts where key = ${`email:${email.toLowerCase()}`}`;
}

/* ------------------------------------------------------------------ */
/* Users and invites                                                    */
/* ------------------------------------------------------------------ */

export async function userCount() {
  await ensureSchema();
  const rows = await sql<{ n: number }>`select count(*) :: int as n from admin_users`;
  return rows[0]?.n ?? 0;
}

export async function createInvite(email: string, role: "admin" | "editor", by: string) {
  const token = crypto.randomBytes(24).toString("base64url");
  await sql`insert into admin_invites (id, email, role, created_by, expires_at)
    values (${sha256(token)}, ${email.toLowerCase()}, ${role}, ${by}, now() + interval '7 days')`;
  return token;
}

export async function findInvite(token: string) {
  if (!token || token.length > 100) return null;
  await ensureSchema();
  const rows = await sql<{ id: string; email: string; role: "admin" | "editor" }>`select id, email, role from admin_invites
    where id = ${sha256(token)} and used_at is null and expires_at > now()`;
  return rows[0] ?? null;
}

export async function logAction(userId: string | null, action: string, target?: string) {
  await sql`insert into admin_log (user_id, action, target) values (${userId}, ${action}, ${target ?? null})`.catch(() => {});
}

export const normEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);
