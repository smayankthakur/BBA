import DeliveryEstimate from "./DeliveryEstimate";

/** Free shipping · prepaid · dated delivery, shown next to every price. */
export type TrustText = { shipping: string; payment: string; minDays: number; maxDays: number };

export default function TrustBar({ compact = false, onDark = false, text }: { compact?: boolean; onDark?: boolean; text: TrustText }) {
  return (
    <ul className={`trust-bar${compact ? " is-compact" : ""}${onDark ? " on-dark" : ""}`} aria-label="Shipping and payment">
      <li>
        <span className="tb-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
            <circle cx="7" cy="17.5" r="1.6" />
            <circle cx="17.5" cy="17.5" r="1.6" />
          </svg>
        </span>
        <span>{text.shipping}</span>
      </li>
      <li>
        <span className="tb-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <span>{text.payment}</span>
      </li>
      <li>
        <span className="tb-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
        </span>
        <span>
          Delivered in <DeliveryEstimate minDays={text.minDays} maxDays={text.maxDays} />
        </span>
      </li>
    </ul>
  );
}
