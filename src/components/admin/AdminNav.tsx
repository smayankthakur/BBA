"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const I = {
  dash: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z",
  box: "M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10",
  gift: "M4 10h16v10H4zM2 7h20v3H2zM12 7v13M12 7c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z",
  img: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9a1.5 1.5 0 1 0 0-.01",
  cart: "M3 4h2l2.5 11h11L21 7H7M9 20a1 1 0 1 0 0-.01M18 20a1 1 0 1 0 0-.01",
  page: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  hand: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
  me: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default function AdminNav({
  role,
}: {
  role: "owner" | "admin" | "editor";
}) {
  const path = usePathname() ?? "";
  const isGift = useSearchParams()?.get("kind") === "gift";
  const items: {
    href: string;
    label: string;
    icon: string;
    match?: (p: string) => boolean;
    min?: "admin" | "owner";
  }[] = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: I.dash,
      match: (p) => p === "/admin",
    },
    { href: "/admin/orders", label: "Orders", icon: I.cart },
    {
      href: "/admin/products?kind=bracelet",
      label: "Bracelets",
      icon: I.box,
      match: (p) => p.startsWith("/admin/products") && !isGift,
    },
    {
      href: "/admin/products?kind=gift",
      label: "Gifts",
      icon: I.gift,
      match: (p) => p.startsWith("/admin/products") && isGift,
    },
    { href: "/admin/coupons", label: "Coupons", icon: I.tag, min: "admin" },
    { href: "/admin/partners", label: "Partners", icon: I.hand, min: "admin" },
    { href: "/admin/media", label: "Media", icon: I.img },
    {
      href: "/admin/pages",
      label: "Pages",
      icon: I.page,
      match: (p) => p.startsWith("/admin/pages") && !p.endsWith("/settings"),
    },
    {
      href: "/admin/pages/settings",
      label: "Settings",
      icon: I.gear,
      min: "admin",
    },
    { href: "/admin/users", label: "Users", icon: I.users, min: "owner" },
    { href: "/admin/account", label: "My account", icon: I.me },
  ];
  const rank = { editor: 1, admin: 2, owner: 3 };
  return (
    <aside className="ad-side" aria-label="Admin menu">
      <nav>
        {items
          .filter((it) => !it.min || rank[role] >= rank[it.min])
          .map((it) => {
            const active = it.match
              ? it.match(path)
              : path.startsWith(it.href.split("?")[0]);
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={active ? "page" : undefined}
              >
                <Icon d={it.icon} />
                {it.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
