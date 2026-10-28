"use client";

import type { ComponentProps } from "react";
import Link from "../LocaleLink";
import { openOrder } from "./open";

/**
 * A normal link (works without JavaScript, opens in a new tab with ⌘/Ctrl)
 * that opens the one-screen order sheet on a plain click.
 */
export default function OrderLink({ slug, onClick, ...rest }: ComponentProps<typeof Link> & { slug?: string }) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (openOrder(slug)) e.preventDefault();
      }}
    />
  );
}
