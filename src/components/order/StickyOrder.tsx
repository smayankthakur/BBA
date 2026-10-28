"use client";

import { useEffect, useState } from "react";
import OrderLink from "./OrderLink";

/** Phones: an "Order" bar fixed to the bottom once the visitor scrolls. */
export default function StickyOrder({ slug, label, sub, href }: { slug?: string; label: string; sub?: string; href: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nearEnd = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 160;
        setShow(window.scrollY > 520 && !nearEnd);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div className={`sticky-order${show ? " is-on" : ""}`} inert={!show}>
      <OrderLink slug={slug} href={href} className="btn btn-lapis sticky-order-btn">
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </OrderLink>
    </div>
  );
}
