import type { Metadata } from "next";
import Notice from "@/components/admin/Notice";
import { requireAdmin } from "@/lib/server/auth";
import { accountAction, signOutEverywhereAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const me = await requireAdmin();
  return (
    <>
      <div className="ad-head">
        <h1>My account</h1>
      </div>
      <Notice sp={sp} />
      <div style={{ maxWidth: 560 }}>
        <section className="ad-box">
          <h2>Profile</h2>
          <form action={accountAction} className="ad-box-body">
            <label className="ad-field">
              <span>Email</span>
              <input value={me.email} readOnly disabled />
            </label>
            <label className="ad-field">
              <span>Name</span>
              <input
                name="name"
                defaultValue={me.name}
                maxLength={80}
                required
                autoComplete="name"
              />
            </label>
            <fieldset
              className="ad-box-body"
              style={{ border: "1px solid var(--ad-line)", padding: 12 }}
            >
              <legend>Change password (optional)</legend>
              <label className="ad-field">
                <span>Current password</span>
                <input
                  type="password"
                  name="current"
                  autoComplete="current-password"
                />
              </label>
              <label className="ad-field">
                <span>New password</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={10}
                />
                <small>
                  At least 10 characters, with letters and numbers. Changing it
                  signs you out on other devices.
                </small>
              </label>
              <label className="ad-field">
                <span>New password again</span>
                <input
                  type="password"
                  name="confirm"
                  autoComplete="new-password"
                />
              </label>
            </fieldset>
            <div>
              <button className="ad-btn is-primary" type="submit">
                Save
              </button>
            </div>
          </form>
        </section>
        <section className="ad-box">
          <h2>Devices</h2>
          <form action={signOutEverywhereAction} className="ad-box-body">
            <p>
              Lost a phone or signed in on someone else&apos;s computer? Sign
              out everywhere, including here.
            </p>
            <div>
              <button className="ad-btn is-danger" type="submit">
                Sign out everywhere
              </button>
            </div>
          </form>
        </section>
        <p className="ad-muted">Role: {me.role}</p>
      </div>
    </>
  );
}
