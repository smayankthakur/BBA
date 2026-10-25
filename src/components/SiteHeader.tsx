"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Medallion from "./Medallion";
import { LINKS } from "@/data/home";

const SHOP_LINKS = [
  { href: "/bracelets", label: "Intentions" },
  { href: "/mulank", label: "By number" },
  { href: "/gifts", label: "Gifts" },
];

const ABOUT_LINKS = [
  { href: "/about-ammit", label: "Ammit" },
  { href: "/consultation", label: "Consultation" },
];

/** Mobile menu extras below the main sections. */
const MORE_LINKS = [
  { href: "/find-your-bracelet", label: "Find my bracelet" },
  { href: "/bracelet-care", label: "Bracelet care" },
  { href: "/reviews", label: "Reviews" },
];

function BagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Compact the bar once the page has scrolled past the announcement strip.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 48));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) burgerRef.current?.focus();
  }, []);

  // Drawer: lock page scroll, focus first link, Esc to close, keep Tab inside.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[1]?.focus(); // [0] is the close button; start on the first link

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // Close if the viewport grows to desktop while open.
    const mq = window.matchMedia("(min-width: 961px)");
    const onMq = () => mq.matches && close(false);
    mq.addEventListener("change", onMq);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open, close]);

  return (
    <>
      <div className={`header-bar${scrolled ? " is-scrolled" : ""}`}>
        <header className="header">
          {/* Mobile: hamburger */}
          <button
            ref={burgerRef}
            type="button"
            className="burger"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav aria-label="Shop" className="header-nav desktop-only">
            {SHOP_LINKS.map((l) => (
              <Link key={l.href} className="navlink" href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>

          <Link href="/" aria-label="Bracelet By Ammit home" className="brand">
            <Medallion width={38} height={42} priority />
            <span className="brand-name">Bracelet By Ammit</span>
          </Link>

          <div className="header-nav right desktop-only">
            {ABOUT_LINKS.map((l) => (
              <Link key={l.href} className="navlink" href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
            <Link className="navlink navlink-order" href="/find-your-bracelet">
              Order now
            </Link>
          </div>

          {/* Mobile: order */}
          <Link className="bag-icon" href="/find-your-bracelet" aria-label="Order a bracelet">
            <BagIcon />
          </Link>
        </header>
      </div>

      {/* Mobile drawer */}
      <div className={`menu-scrim${open ? " is-open" : ""}`} onClick={() => close(false)} aria-hidden="true" />
      <div
        id="site-menu"
        ref={panelRef}
        className={`menu-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
      >
        <div className="menu-top">
          <span className="menu-brand">
            <Medallion width={30} height={33} />
            <span>Bracelet By Ammit</span>
          </span>
          <button type="button" className="menu-close" aria-label="Close menu" onClick={() => close()}>
            <span />
            <span />
          </button>
        </div>

        <nav aria-label="Menu" className="menu-nav">
          <p className="menu-label">Shop</p>
          {SHOP_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="menu-link"
              onClick={() => close(false)}
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <p className="menu-label">Bracelet By Ammit</p>
          {ABOUT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="menu-link"
              onClick={() => close(false)}
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          {MORE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="menu-link"
              onClick={() => close(false)}
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="menu-foot">
          <Link className="btn btn-gold" href="/find-your-bracelet" onClick={() => close(false)}>
            Order a bracelet
          </Link>
          <Link className="btn btn-ghost-gold" href="/consultation" onClick={() => close(false)}>
            Ask Ammit
          </Link>
          <div className="menu-social">
            <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
              YouTube
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
