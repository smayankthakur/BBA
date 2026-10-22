import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Same-origin by default. 'unsafe-inline' is required for the inline
// bootstrap scripts Next.js emits on statically prerendered pages (nonces
// would force dynamic rendering).
//  - YouTube: click-to-play embeds use the privacy-enhanced nocookie domain.
//  - Analytics hosts are only allowed when their IDs are configured; the
//    scripts themselves load only after the visitor accepts cookies.
const GA = !!process.env.NEXT_PUBLIC_GA_ID;
const META = !!process.env.NEXT_PUBLIC_META_PIXEL_ID;

const scriptSrc = ["'self'", "'unsafe-inline'", GA && "https://www.googletagmanager.com", META && "https://connect.facebook.net"];
const connectSrc = [
  "'self'",
  GA && "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  META && "https://www.facebook.com https://connect.facebook.net",
];
const imgSrc = ["'self'", "data:", "blob:", GA && "https://*.google-analytics.com https://www.googletagmanager.com", META && "https://www.facebook.com"];

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc.filter(Boolean).join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc.filter(Boolean).join(" ")}`,
  "font-src 'self'",
  `connect-src ${connectSrc.filter(Boolean).join(" ")}`,
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  // CSP only in production: `next dev` needs eval for fast refresh.
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
