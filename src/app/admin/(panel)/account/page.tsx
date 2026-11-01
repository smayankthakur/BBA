import type { Metadata } from "next";
import Notice from "@/components/admin/Notice";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { requireAdmin, twoStepFor } from "@/lib/server/auth";
import { otpauthUri } from "@/lib/server/totp";
import {
  accountAction,
  disableTwoStepAction,
  enableTwoStepAction,
  hideRecoveryCodesAction,
  newRecoveryCodesAction,
  setupTwoStepAction,
  signOutEverywhereAction,
} from "@/app/admin/actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const me = await requireAdmin();
  const t = await twoStepFor(me.id);
  const settingUp = !t.enabled && !!t.secret && sp.setup === "1";
  const qr = settingUp ? await QRCode.toString(otpauthUri(t.secret!, me.email), { type: "svg", margin: 1, width: 200 }) : "";
  const codes = ((await cookies()).get("bba_rc")?.value ?? "").split(" ").filter(Boolean);
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
        <section className="ad-box" id="two-step">
          <h2>
            Two-step login <span className={`ad-pill ${t.enabled ? "ok" : "warn"}`}>{t.enabled ? "On" : "Off"}</span>
          </h2>
          <div className="ad-box-body">
            {codes.length > 0 && (
              <div className="ad-notice is-warn">
                <p>
                  <b>Save these recovery codes now</b> (print them or keep them in a password manager). Each works once if you lose your phone. They
                  won&apos;t be shown again.
                </p>
                <ul className="ad-codes">
                  {codes.map((c) => (
                    <li key={c}>
                      <code>{c}</code>
                    </li>
                  ))}
                </ul>
                <form action={hideRecoveryCodesAction}>
                  <button className="ad-btn" type="submit">
                    I&apos;ve saved them
                  </button>
                </form>
              </div>
            )}
            {t.enabled ? (
              <>
                <p>
                  Signing in asks for a code from your authenticator app as well as your password. Recovery codes left: {t.recoveryLeft}.
                </p>
                <form action={newRecoveryCodesAction} className="ad-inline-form">
                  <label className="ad-field">
                    <span>Code from your app</span>
                    <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
                  </label>
                  <button className="ad-btn" type="submit">
                    New recovery codes
                  </button>
                  <button className="ad-btn is-danger" type="submit" formAction={disableTwoStepAction}>
                    Turn off
                  </button>
                </form>
              </>
            ) : settingUp ? (
              <>
                <ol className="ad-steps">
                  <li>Install an authenticator app on your phone (Google Authenticator, Microsoft Authenticator or 1Password).</li>
                  <li>In the app, add an account and scan this code:</li>
                </ol>
                <div className="ad-qr" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label="QR code for your authenticator app" />
                <p className="ad-help">
                  Can&apos;t scan? Enter this key: <code className="ad-copy">{t.secret!.replace(/(.{4})/g, "$1 ").trim()}</code>
                </p>
                <form action={enableTwoStepAction} className="ad-inline-form">
                  <label className="ad-field">
                    <span>3. Type the 6-digit code the app shows</span>
                    <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus />
                  </label>
                  <button className="ad-btn is-primary" type="submit">
                    Turn on
                  </button>
                </form>
              </>
            ) : (
              <>
                <p>
                  Protects the panel even if your password leaks: signing in also needs a 6-digit code from an app on your phone.
                  {me.role === "owner" && " Strongly recommended for the owner account."}
                </p>
                <form action={setupTwoStepAction}>
                  <button className="ad-btn is-primary" type="submit">
                    Set up two-step login
                  </button>
                </form>
              </>
            )}
          </div>
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
