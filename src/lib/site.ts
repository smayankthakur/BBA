/**
 * Canonical site URL. Set NEXT_PUBLIC_SITE_URL to the real domain at launch
 * (e.g. https://braceletbyammit.com). On Vercel it falls back to the
 * project's production URL; locally to localhost.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * Search-engine indexing is OFF until NEXT_PUBLIC_SITE_LIVE=true is set in the
 * production environment, so staging/review deployments never get indexed.
 */
export const SITE_LIVE = process.env.NEXT_PUBLIC_SITE_LIVE === "true";
