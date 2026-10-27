import type { Metadata } from "next";
import { headers } from "next/headers";
import Notice from "@/components/admin/Notice";
import CopyField from "@/components/admin/CopyField";
import { requireAdmin, validEmail } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import {
  inviteAction,
  revokeInviteAction,
  userAction,
} from "@/app/admin/actions";

export const metadata: Metadata = { title: "Users" };

const fmt = (d: string | Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(d))
    : "Never";

const ROLE_HELP = {
  owner: "Everything, including users",
  admin: "Everything except users",
  editor: "Products, pages, media and orders. Not settings or CSV export",
};

type U = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "editor";
  disabled: boolean;
  created_at: string;
  last_login_at: string | null;
};
type I = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const me = await requireAdmin("owner");
  const [users, invites, h] = await Promise.all([
    sql<U>`select id, email, name, role, disabled, created_at, last_login_at from admin_users order by created_at`,
    sql<I>`select id, email, role, expires_at, created_at from admin_invites where used_at is null and expires_at > now() order by created_at desc`,
    headers(),
  ]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.")
      ? "http"
      : "https");
  const token = /^[\w-]{20,100}$/.test(sp.invite ?? "") ? sp.invite : "";
  const inviteFor = validEmail(sp.for ?? "") ? sp.for : "";

  return (
    <>
      <div className="ad-head">
        <h1>Users</h1>
      </div>
      <Notice sp={sp} />
      {token && (
        <div className="ad-notice" role="status">
          <p>
            <b>Invite created for {inviteFor}.</b> Send them this link (WhatsApp
            or email). It works once and expires in 7 days. It is shown only
            now.
          </p>
          <CopyField
            value={`${proto}://${host}/admin/register?invite=${token}`}
            label="Invite link"
            clearQuery
          />
        </div>
      )}

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Last signed in</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="t-title">{u.name}</span>
                  {u.id === me.id && <span className="ad-muted"> (you)</span>}
                  <div className="ad-muted">{u.email}</div>
                  {u.role !== "owner" && (
                    <div className="ad-row-actions">
                      {(u.role === "editor" ? ["admin"] : ["editor"]).map(
                        (r) => (
                          <form key={r} action={userAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="op" value={r} />
                            <button className="ad-link-btn">Make {r}</button>
                          </form>
                        ),
                      )}
                      <form action={userAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="hidden"
                          name="op"
                          value={u.disabled ? "enable" : "disable"}
                        />
                        <button className="ad-link-btn">
                          {u.disabled ? "Allow sign-in" : "Block sign-in"}
                        </button>
                      </form>
                      <form action={userAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="op" value="delete" />
                        <button className="ad-link-btn is-danger">
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </td>
                <td>
                  <span
                    className={`ad-pill ${u.role === "owner" ? "ok" : "info"}`}
                  >
                    {u.role}
                  </span>
                  {u.disabled && <span className="ad-pill err">blocked</span>}
                  <div className="ad-muted">{ROLE_HELP[u.role]}</div>
                </td>
                <td>{fmt(u.last_login_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ad-two" style={{ marginTop: 20 }}>
        <section className="ad-box">
          <h2>Invite someone</h2>
          <form action={inviteAction} className="ad-box-body">
            <label className="ad-field">
              <span>Their email</span>
              <input
                type="email"
                name="email"
                required
                maxLength={200}
                autoComplete="off"
              />
            </label>
            <label className="ad-field">
              <span>Role</span>
              <select name="role" defaultValue="editor">
                <option value="editor">Editor: {ROLE_HELP.editor}</option>
                <option value="admin">Admin: {ROLE_HELP.admin}</option>
              </select>
            </label>
            <div>
              <button className="ad-btn is-primary" type="submit">
                Create invite link
              </button>
            </div>
            <small className="ad-help">
              Nobody can create an account without an invite from you.
            </small>
          </form>
        </section>
        <section className="ad-box">
          <h2>Pending invites</h2>
          <div className="ad-box-body">
            {invites.length === 0 ? (
              <p className="ad-muted">None.</p>
            ) : (
              <ul className="ad-list">
                {invites.map((i) => (
                  <li key={i.id}>
                    <b>{i.email}</b> · {i.role}
                    <div className="ad-muted">Expires {fmt(i.expires_at)}</div>
                    <form action={revokeInviteAction}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="ad-link-btn is-danger">
                        Cancel invite
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
