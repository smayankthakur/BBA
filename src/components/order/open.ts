/** Opening the one-screen order sheet from anywhere on the page. */
export const ORDER_EVENT = "bba:order";

declare global {
  interface Window {
    /** Set while the order sheet is on the page */
    __bbaOrderReady?: boolean;
  }
}

/** Opens the order sheet (optionally for one purpose). False if the sheet isn't on this page. */
export function openOrder(slug?: string) {
  if (typeof window === "undefined" || !window.__bbaOrderReady) return false;
  window.dispatchEvent(new CustomEvent(ORDER_EVENT, { detail: { slug } }));
  return true;
}
