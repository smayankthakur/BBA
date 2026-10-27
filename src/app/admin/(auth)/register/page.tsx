import Link from "next/link";
import AuthLogo from "@/components/admin/AuthLogo";
import { registerAction } from "../../actions";
import { findInvite, userCount } from "@/lib/server/auth";
import { dbConfigured } from "@/lib/server/db";

const ERR: Record<string, string> = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  weak: "Use a password of at least 10 characters with letters and numbers.",
  mismatch: "The two passwords don't match.",
  invite:
    "This invite link has expired or was already used. Ask the owner for a new one.",
  taken: "An account with this email already exists. Sign in instead.",
  closed: "The owner account already exists. Registration is by invite only.",
};

export default async function RegisterPage({
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
      </div>
    );
  }
  const first = (await userCount()) === 0;
  const invite = sp.invite ? await findInvite(sp.invite) : null;

  if (!first && !invite) {
    return (
      <div className="ad-auth-card">
        <AuthLogo />
        <h1>Registration is by invite</h1>
        {sp.invite && (
          <div className="ad-notice is-err" role="alert">
            <p>{ERR.invite}</p>
          </div>
        )}
        <p>
          To keep customer orders safe, new admin accounts can only be created
          with an invite link from the owner.
        </p>
        <Link className="ad-btn is-primary" href="/admin/login">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="ad-auth-card">
      <AuthLogo />
      <h1>{first ? "Create the owner account" : "Join the admin team"}</h1>
      {first ? (
        <p className="ad-help">
          This is the first account, so it becomes the owner. After this, new
          people can only join with an invite from you.
        </p>
      ) : (
        <p className="ad-help">
          You&apos;ve been invited as <b>{invite!.role}</b> with{" "}
          <b>{invite!.email}</b>.
        </p>
      )}
      {sp.err && ERR[sp.err] && (
        <div className="ad-notice is-err" role="alert">
          <p>{ERR[sp.err]}</p>
        </div>
      )}
      <form action={registerAction}>
        {invite && <input type="hidden" name="invite" value={sp.invite} />}
        <label className="ad-field">
          <span>Your name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
          />
        </label>
        {first && (
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
        )}
        <label className="ad-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={200}
          />
          <small>At least 10 characters, with letters and numbers.</small>
        </label>
        <label className="ad-field">
          <span>Repeat password</span>
          <input
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={200}
          />
        </label>
        <button className="ad-btn is-primary" type="submit">
          Create account
        </button>
      </form>
    </div>
  );
}
