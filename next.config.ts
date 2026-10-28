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
// Razorpay Checkout hosts, only when checkout is configured.
const RZP = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  GA && "https://www.googletagmanager.com",
  META && "https://connect.facebook.net",
  RZP && "https://checkout.razorpay.com",
];
const connectSrc = [
  "'self'",
  GA && "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  META && "https://www.facebook.com https://connect.facebook.net",
  RZP && "https://api.razorpay.com https://lumberjack.razorpay.com",
];
const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  // Photos uploaded in the admin panel (Vercel Blob)
  "https://*.public.blob.vercel-storage.com",
  GA && "https://*.google-analytics.com https://www.googletagmanager.com",
  META && "https://www.facebook.com",
  RZP && "https://cdn.razorpay.com",
];
const frameSrc = ["https://www.youtube-nocookie.com", "https://www.instagram.com", RZP && "https://api.razorpay.com https://checkout.razorpay.com"];

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc.filter(Boolean).join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc.filter(Boolean).join(" ")}`,
  "font-src 'self'",
  `connect-src ${connectSrc.filter(Boolean).join(" ")}`,
  `frame-src ${frameSrc.filter(Boolean).join(" ")}`,
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
  {
    key: "Permissions-Policy",
    value: `camera=(), microphone=(), geolocation=(), payment=${RZP ? '(self "https://api.razorpay.com" "https://checkout.razorpay.com")' : "()"}, usb=(), interest-cohort=()`,
  },
  // CSP only in production: `next dev` needs eval for fast refresh.
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Local photos carry a ?v=<hash> so replaced files are never served from an old cache.
  images: {
    localPatterns: [{ pathname: "/**" }],
    // Photos uploaded in the admin panel live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  // Bracelet pages renamed for the client's purpose list (Oct 2026).
  async redirects() {
    const moved: Record<string, string> = {
      "career-and-money": "career-and-finance",
      "love-and-relationships": "love-life",
      "health-and-mental-healing": "health",
      "buri-nazar-protection": "buri-nazar",
      "better-married-life": "married-life",
      "better-studies": "studies",
    };
    return [
      ...Object.entries(moved).map(([from, to]) => ({ source: `/bracelets/${from}`, destination: `/bracelets/${to}`, permanent: true })),
      // The list of purposes lives on the homepage; numerology pages were removed (client, 28 Oct 2026).
      ...["", "/hi", "/hinglish"].flatMap((pre) => [
        { source: `${pre}/bracelets/3-in-1`, destination: `${pre || "/"}#edit`, permanent: false },
        { source: `${pre}/bracelets`, destination: `${pre || "/"}#edit`, permanent: false },
        { source: `${pre}/mulank`, destination: pre || "/", permanent: false },
        { source: `${pre}/mulank/:n`, destination: pre || "/", permanent: false },
        { source: `${pre}/numerology`, destination: pre || "/", permanent: false },
        { source: `${pre}/numerology/:path*`, destination: pre || "/", permanent: false },
      ]),
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
