import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../admin.css";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/server/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <div className="ad-body">
      <div className="ad">
        <header className="ad-top">
          <Link className="ad-brand" href="/admin">
            <Image src="/brand/emblem.png" alt="" width={26} height={26} />
            <span>Bracelet By Ammit</span>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer">
            View site ↗
          </a>
          <span className="ad-top-spacer" />
          <span className="ad-hide-sm">
            {user.name} · {user.role}
          </span>
          <form action={logoutAction}>
            <button type="submit">Sign out</button>
          </form>
        </header>
        <AdminNav role={user.role} />
        <main className="ad-main" id="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
