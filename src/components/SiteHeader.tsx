"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "./LocaleLink";
import Medallion from "./Medallion";
import LangSwitch from "./LangSwitch";
import OrderLink from "./order/OrderLink";
import { useLang } from "./LangProvider";
import { splitPath } from "@/lib/i18n/config";

function BagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export type HeaderPurpose = { slug: string; title: string; photo: string | null };

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SiteHeader({ instagram, youtube, purposes = [] }: { instagram: string; youtube: string; purposes?: HeaderPurpose[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { ui } = useLang();
  const h = ui.header;
  /** Desktop: left of the logo (after the Purposes menu) */
  const LEFT_LINKS = [
    { href: "/reviews", label: h.more.reviews },
    { href: "/bracelet-care", label: h.more.care },
  ];
  const ABOUT_LINKS = [
    { href: "/about-ammit", label: h.nav.ammit },
    { href: "/consultation", label: h.nav.consultation },
  ];
  /** Mobile menu: everything else */
  const MORE_LINKS = [
    { href: "/about-ammit", label: h.nav.ammit },
    { href: "/consultation", label: h.nav.consultation },
    { href: "/find-your-bracelet", label: h.more.find },
    { href: "/reviews", label: h.more.reviews },
    { href: "/bracelet-care", label: h.more.care },
  ];
  // Desktop "Purposes" dropdown
  const [dd, setDd] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  const ddTimer = useRef<number | undefined>(undefined);
  const hoverOpen = () => {
    window.clearTimeout(ddTimer.current);
    ddTimer.current = window.setTimeout(() => setDd(true), 120);
  };
  const hoverClose = () => {
    window.clearTimeout(ddTimer.current);
    ddTimer.current = window.setTimeout(() => setDd(false), 220);
  };
  useEffect(() => {
    if (!dd) return;
    const onDown = (e: MouseEvent) => !ddRef.current?.contains(e.target as Node) && setDd(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDd(false);
        ddRef.current?.querySelector<HTMLButtonElement>(".nav-dd-btn")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dd]);
  // Active link, ignoring the /hi or /hinglish prefix.
  const pathname = splitPath(usePathname() ?? "/").path;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Brand mark: "Bracelet By Ammit" folds into "BBA", like the intro loader.
  // On the home page it waits for the loader to finish.
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setFolded(true);
      return;
    }
    const delay = (document.querySelector(".withload") && !document.documentElement.classList.contains("intro-seen")) ? 3900 : 700;
    const t = window.setTimeout(() => setFolded(true), delay);
    return () => window.clearTimeout(t);
  }, []);

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
            aria-label={h.openMenu}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav aria-label={h.shop} className="header-nav desktop-only">
            {purposes.length > 0 ? (
              <div
                className={`nav-dd${dd ? " is-open" : ""}`}
                ref={ddRef}
                onMouseEnter={hoverOpen}
                onMouseLeave={hoverClose}
                onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDd(false)}
              >
                <button
                  type="button"
                  className={`navlink nav-dd-btn${pathname.startsWith("/bracelets/") ? " is-active" : ""}`}
                  aria-expanded={dd}
                  aria-controls="nav-purposes"
                  onClick={() => setDd((v) => !v)}
                >
                  {h.nav.purposes} <ChevronIcon />
                </button>
                <div className="nav-dd-panel" id="nav-purposes" hidden={!dd}>
                  <p className="nav-dd-title">{h.purposesMenu}</p>
                  <ul>
                    {purposes.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/bracelets/${p.slug}`} onClick={() => setDd(false)} aria-current={pathname === `/bracelets/${p.slug}` ? "page" : undefined}>
                          <span className="nav-dd-img">{p.photo && <Image src={p.photo} alt="" fill sizes="44px" />}</span>
                          <span>{p.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link className="nav-dd-all" href="/#edit" onClick={() => setDd(false)}>
                    {h.allPurposes} →
                  </Link>
                </div>
              </div>
            ) : (
              <Link className="navlink" href="/#edit">
                {h.nav.purposes}
              </Link>
            )}
            {LEFT_LINKS.map((l) => (
              <Link key={l.href} className="navlink" href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>

          <Link href="/" aria-label={ui.common.homeAria} className="brand">
            <Medallion width={38} height={42} priority />
            <span className={`brand-anim${folded ? " is-folded" : ""}`} aria-hidden="true">
              <span className="ini">B</span>
              <span className="fade">racelet </span>
              <span className="ini">B</span>
              <span className="fade">y </span>
              <span className="ini">A</span>
              <span className="fade">mmit</span>
            </span>
          </Link>

          <div className="header-nav right desktop-only">
            {ABOUT_LINKS.map((l) => (
              <Link key={l.href} className="navlink" href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
            <OrderLink className="btn btn-lapis nav-order" href="/find-your-bracelet" aria-haspopup="dialog">
              {h.orderNow}
            </OrderLink>
          </div>

          {/* Mobile: order */}
          <OrderLink className="bag-icon" href="/find-your-bracelet" aria-label={h.orderAria} aria-haspopup="dialog">
            <BagIcon />
          </OrderLink>
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
        aria-label={h.menu}
        inert={!open}
      >
        <div className="menu-top">
          <span className="menu-brand">
            <Medallion width={30} height={33} />
            <span>Bracelet By Ammit</span>
          </span>
          <button type="button" className="menu-close" aria-label={h.closeMenu} onClick={() => close()}>
            <span />
            <span />
          </button>
        </div>

        <LangSwitch className="is-menu" />
        <nav aria-label={h.menu} className="menu-nav">
          <p className="menu-label">{h.purposesMenu}</p>
          {purposes.length > 0 ? (
            <ul className="menu-purposes">
              {purposes.map((p) => (
                <li key={p.slug}>
                  <Link href={`/bracelets/${p.slug}`} onClick={() => close(false)} aria-current={pathname === `/bracelets/${p.slug}` ? "page" : undefined}>
                    <span className="menu-purpose-img">{p.photo && <Image src={p.photo} alt="" fill sizes="40px" />}</span>
                    <span>{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Link href="/#edit" className="menu-link" onClick={() => close(false)}>
              {h.nav.purposes}
            </Link>
          )}
          <p className="menu-label">Bracelet By Ammit</p>
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
          <OrderLink className="btn btn-gold" href="/find-your-bracelet" onClick={() => close(false)} aria-haspopup="dialog">
            {ui.common.orderBracelet}
          </OrderLink>
          <Link className="btn btn-ghost-gold" href="/consultation" onClick={() => close(false)}>
            {h.askAmmit}
          </Link>
          <div className="menu-social">
            <a href={instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={youtube} target="_blank" rel="noopener noreferrer">
              YouTube
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
