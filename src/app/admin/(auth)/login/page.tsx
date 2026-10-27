import { redirect } from "next/navigation";
import Link from "next/link";
import AuthLogo from "@/components/admin/AuthLogo";
import { loginAction } from "../../actions";
import { getAdmin, userCount } from "@/lib/server/auth";
import { dbConfigured } from "@/lib/server/db";

const ERR: Record<string, string> = {
  missing: "Enter your email and password.",
  bad: "That email and password don't match an account.",
  locked: "Too many attempts. Please wait 15 minutes and try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  if (!dbConfigured()) {
    return (
      <div className="ad-auth-card">
        <AuthLogo />
        <h1>Database not connected</h1>
        <p>
          The admin panel needs the order database (DATABASE_URL). Connect Neon
          in Vercel → Storage.
        </p>
      </div>
    );
  }
  if (await getAdmin()) redirect("/admin");
  if ((await userCount()) === 0) redirect("/admin/register");

  return (
    <div className="ad-auth-card">
      <AuthLogo />
      <h1>Sign in</h1>
      {sp.msg === "out" && (
        <div className="ad-notice">
          <p>You&apos;re signed out.</p>
        </div>
      )}
      {sp.err && ERR[sp.err] && (
        <div className="ad-notice is-err" role="alert">
          <p>{ERR[sp.err]}</p>
        </div>
      )}
      <form action={loginAction}>
        <label className="ad-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            maxLength={200}
          />
        </label>
        <label className="ad-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            maxLength={200}
          />
        </label>
        <button className="ad-btn is-primary" type="submit">
          Sign in
        </button>
      </form>
      <p className="ad-help">
        New team member? Ask the owner for an invite link.{" "}
        <Link href="/admin/register">About registering</Link>
      </p>
    </div>
  );
}
