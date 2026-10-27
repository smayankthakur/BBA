import type { Metadata } from "next";
import "../admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ad-body">
      <div className="ad-auth">
        <div>
          {children}
          <p className="ad-auth-foot">
            <a href="/">← Back to the website</a>
          </p>
        </div>
      </div>
    </div>
  );
}
