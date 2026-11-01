import { redirect } from "next/navigation";
import AuthLogo from "@/components/admin/AuthLogo";
import { twoStepLoginAction } from "../../../actions";
import { pendingTwoStepUser } from "@/lib/server/auth";

export default async function TwoStepCodePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const pending = await pendingTwoStepUser();
  if (!pending) redirect("/admin/login?err=expired");
  return (
    <div className="ad-auth-card">
      <AuthLogo />
      <h1>Enter your code</h1>
      <p className="ad-help">Open your authenticator app and type the 6-digit code for Bracelet By Ammit.</p>
      {sp.err === "totp" && (
        <div className="ad-notice is-err" role="alert">
          <p>That code isn&apos;t right. Check the time on your phone and try again.</p>
        </div>
      )}
      <form action={twoStepLoginAction}>
        <label className="ad-field">
          <span>Code</span>
          <input name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={12} autoFocus placeholder="123456" />
          <small>Lost your phone? Type one of your recovery codes instead (like k3f9-2mqd).</small>
        </label>
        <button className="ad-btn is-primary" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
