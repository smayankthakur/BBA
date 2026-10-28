# Bracelet By Ammit — website (Next.js)

Homepage built from design concept **3F · Intention Royal (3 hero + 3E)**.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Requires Node 20+.

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Variable | When | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | at launch | Real domain, e.g. `https://braceletbyammit.com`. Used for canonical URL, sitemap and share image. Falls back to the Vercel production URL. |
| `RAZORPAY_KEY_ID` | for checkout | Razorpay key ID (test `rzp_test_…` first, then live). Server only. |
| `RAZORPAY_KEY_SECRET` | for checkout | Razorpay key secret. **Server only, never NEXT_PUBLIC.** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | for checkout | Same key ID as above; switches the funnel from the Google Form to the on-site checkout and opens the Razorpay hosts in the CSP. |
| `RAZORPAY_WEBHOOK_SECRET` | for checkout | Secret set on the Razorpay webhook (URL `/api/razorpay/webhook`, events `order.paid`, `payment.captured`, `payment.failed`). |
| `DATABASE_URL` | order database | Set automatically when Neon is added in Vercel → Storage. The `orders` table is created on first use (schema also in `db/schema.sql`). Check with `GET /api/health/db` → `{"db":"ok"}`. Without it, every order is still recorded in Razorpay (all details are in the order notes). |
| `RESEND_API_KEY`, `STAFF_ORDER_EMAILS`, `ORDER_EMAIL_FROM` | staff order email | When an order is paid, a **staff-only PDF** with every detail from the order form is emailed to `STAFF_ORDER_EMAILS` (comma-separated). Sent once per order; customers never see it. `ORDER_EMAIL_FROM` needs a domain verified in Resend (until then Resend's test sender only delivers to the Resend account's own email). |
| `BLOB_READ_WRITE_TOKEN` | admin photo uploads | Set automatically by the Vercel Blob store `bba-media` (connected). Photos uploaded in the admin panel are stored there. For local testing without Blob, `MEDIA_LOCAL=1` writes to `public/uploads` (works with `npm run dev`). |
| `NEXT_PUBLIC_GA_ID` | optional | Google Analytics 4 ID (G-…). Loads only after the visitor accepts cookies. |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional | Meta Pixel ID. Same consent rule. Funnel fires Lead and InitiateCheckout. |
| `NEXT_PUBLIC_SITE_LIVE` | at launch | Set to `true` **only when launching**. Until then every deployment sends `noindex` and robots.txt blocks crawlers. |

## Admin panel (`/admin`)

A WordPress-style back office. It needs `DATABASE_URL` (Neon); every table is created on first use.

- **First sign-up becomes the owner.** Open `/admin/register` once the site is live and create the owner account. After that, registration is closed: the owner invites people from **Users** (a one-time link, valid 7 days).
- **Roles:** owner (everything, including users) · admin (everything except users) · editor (products, pages, media, orders; not site settings or CSV export).
- **Bracelets / Gifts:** add, edit, draft, trash, restore, delete permanently. Title, web address (slug), price (this is what checkout charges), descriptions, lists, crystals, photos (upload or pick from the library, reorder, main photo first), video, Google title/description, fallback colours. New products get a page on first visit.
- **Pages:** every piece of text on the site, the reviews, FAQs, mulank 1–9 meanings (used by the 60-second reading), policies (simple Markdown), plus **Settings** (business details, prices for 1/2/3 purposes, delivery days, links, Instagram reel, staff order email, SEO). Each page has **English · हिन्दी · Hinglish** tabs (see Languages). "Go back to the original text" resets a page in the language you're on.
- **Reviews:** Pages → Reviews → *Review screenshots*. Use **Upload or pick several** to add this week's Instagram screenshots in one go (newest first). The written reviews stay as the fallback until screenshots are added. The dashboard reminds you when screenshots haven't been updated for 7 days.
- **Orders:** every paid or started order with all reading-form details, filters and search, progress (new → reading → being made → shipped → delivered), courier and tracking, private notes, staff PDF and CSV export.
- **Coupons** (owner and admins): percentage (with optional cap) or fixed ₹ off, minimum price, start/end dates (India time), total and per-customer limits (by mobile, paid orders), all bracelets or chosen ones, switch on/off, delete. Each coupon has an offer link (`/find-your-bracelet?coupon=CODE`) that applies it at checkout. Customers can also type it at checkout. The server re-checks the code when the payment is created, so the browser can't change the price. Orders, the staff PDF and the CSV show the coupon and discount.
- **Partners** (owner and admins): add a partner with a unique code, commission (percentage of what the customer pays, or a fixed ₹ per order) and payout details. Their link is `/p/CODE` (or `?ref=CODE` on any page). The visit is remembered for 30 days (last link clicked wins). Each partner page shows clicks, paid orders, revenue, commission earned, payouts recorded and the balance. Commission is fixed when the order is placed; a percentage partner also earns on purposes added after payment. Orders, the staff PDF and the CSV show the partner.
- **Media:** upload (phone photos are shrunk in the browser, then converted to WebP ≤2000px), copy link, delete (refused while a product or page uses the image).
- Security: scrypt passwords, httpOnly session cookie (7 days), sign-in lockout after 8 failures in 15 minutes, same-origin checks on uploads, every change logged in `admin_log`. Changes go live on the next page visit.

## Security and SEO built in

- Security headers on every response (`next.config.ts`): HSTS, CSP (same-origin only), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy; `x-powered-by` removed.
- `robots.txt`, `sitemap.xml`, canonical URL, Open Graph/Twitter card with `src/app/opengraph-image.png`, app icons.
- Branded 404 page (`src/app/not-found.tsx`), skip-to-content link, axe-clean at desktop and mobile widths.
- If you add analytics, a chat widget, embeds or forms later, add their domains to the CSP and add a privacy policy + cookie consent first.

## Pages and URLs

Every public page exists in three languages: English at `/…`, Hindi at `/hi/…`, Hinglish at `/hinglish/…`.

| URL | Page |
|---|---|
| `/` | Homepage (purposes list at `/#edit`) |
| `/find-your-bracelet` | 60-second reading → recommended bracelet → checkout |
| `/bracelets/career-and-finance` · `love-life` · `clarity-and-confidence` · `health` · `buri-nazar` · `self-healing` · `married-life` · `studies` · `delay-in-marriage` · `weight-loss` | The 10 purpose bracelets (₹1,200, Product schema) |
| `/about-ammit` | About Ammit Kukreja (Person schema) |
| `/consultation` | Numerology consultation |
| `/bracelet-care` | Care guide |
| `/reviews` | Customer reviews (Instagram screenshots, then written reviews) |
| `/privacy` · `/terms` · `/shipping` · `/returns` | Policies |
| `/size-guide` | How to measure + size table |
| `/p/CODE` | Partner link: remembers the partner, then opens the homepage (or `?to=/path`) |
| `/tools/reading-card` | **Staff only** (noindex): print the reading card for an order |

**Removed (Oct 2026, client request):** `/mulank`, `/mulank/1–9`, `/numerology`, the Lo Shu grid calculator, `/bracelets` (shop by intention), `/bracelets/3-in-1`, and the gift pages and homepage gift section (`/gifts`, `/gifts/…`; gifting is the "It's a gift" tick in the order form). `/gifts` redirects to the purposes list. Old addresses redirect permanently: the numerology pages to the homepage, `/bracelets` and the 3-in-1 to the purposes list (`/#edit`), and the old bracelet slugs (e.g. `/bracelets/love-and-relationships`) to the new ones (`next.config.ts`).

All pages have their own title/description, canonical, hreflang alternates for the three languages, breadcrumbs, and are listed in `sitemap.xml`.

## Languages (English · हिन्दी · Hinglish)

- The switcher sits in the top strip and in the mobile menu, and opens the same page in the other language.
- **First visit:** a pop-up asks English / हिन्दी / Hinglish (after the homepage intro). The choice is saved in the `bba_lang` cookie (1 year); closing it keeps the language being read. From then on, a plain address (e.g. `/gifts`) opens in the chosen language (`src/proxy.ts`); addresses that already include `/hi` or `/hinglish` open as shared. The switcher links carry `?lang=…`, which updates the choice (works without JavaScript). Mentioned in the privacy policy.
- `src/proxy.ts` serves English without a prefix (internally `/en/…`) and redirects `/en/…` to the bare address.
- **Interface text** (buttons, form labels, errors, emails to the customer): `src/lib/i18n/ui.en.ts` (English, the source), `ui.hi.ts`, `ui.hn.ts`, `ui.extra.ts`.
- **Page text:** built-in translations in `src/lib/i18n/content.hi.ts` / `content.hn.ts`. Edit them in **Admin → Pages → हिन्दी / Hinglish tab**; your edits override the built-in text. The tab shows the English next to each field.
- **Shared fields** are edited only on the English tab and used by every language: prices, numbers, links, photos, videos, colours, toggles, business details (brand, legal name, address, phone, email, GSTIN, grievance officer).
- **Product text:** each bracelet/gift has a *Translations* box (Hindi, Hinglish). Empty fields fall back to English.
- Staff-facing things (order titles, staff PDF, CSV, admin) stay in English.
- Translated policies start with a line saying the English version prevails.
- Have a native speaker review the Hindi before launch.

## Purposes and pricing

- The 10 purposes are in `src/data/home.ts` (`INTENTIONS`) and in the products table (Admin → Bracelets).
- Price is per number of purposes, not shown up front: **1 purpose ₹1,200 · 2 purposes ₹1,900 · 3 purposes ₹3,000** (Settings → `defaultPrice`, `price2`, `price3`). `src/lib/pricing.ts` works out the total on the server.
- At checkout the customer can add a 2nd/3rd purpose. After payment, the confirmation screen offers the same add-on as a top-up payment (`/api/checkout/upgrade`, `order_upgrades` table); the order shows the purposes and any top-ups.
- The homepage "Made for you" section has the Instagram reel (Settings → reel link) with a cover photo (Pages → Home). Cover photo: Unsplash, Sahil Kumar (`public/reel/CREDITS.txt`).

## Quick order (the main way to buy)

`src/components/order/` — a one-screen order sheet that opens on top of the page:

- **Opens from:** the homepage purpose rows, "Order this bracelet" on bracelet pages, the header "Order now" / bag icon, the phone sticky bar, and any link with `?order=<purpose>` (e.g. `/?order=love-life` for an Instagram bio; `?coupon=CODE` works too).
- **One screen:** purpose (change or add a 2nd/3rd with its price shown), WhatsApp number, name, date of birth, wrist size (or "Not sure"), PIN code (fills city and state via `/api/pincode`, India Post's public lookup; falls back to typing), house/street, area. Gift option asks for the delivery name. Under-18 wearers need the guardian tick. Pay → Razorpay.
- **After payment:** "Help Ammit Ji design your bracelet" asks gender, what they want help with (the bracelet's "for you if" lines) and a note, saved via `/api/order/details`; then the mulank/bhagyank reveal and the add-a-purpose top-up. Skipping is fine: the order shows "Quick order · details not added yet" and the admin page has an "Ask on WhatsApp" link with the questions ready.
- Staff get the paid-order email straight away and a second "Details added" email when the customer adds them.
- **Before online payment is switched on** (no `NEXT_PUBLIC_RAZORPAY_KEY_ID`), the same sheet sends the order on WhatsApp (to the Settings phone number) with all the details filled in.
- The intro animation plays on the first visit only (`localStorage` `bba_intro`).
- The 60-second reading (`/find-your-bracelet`) is still there for visitors who want it.
- Unpaid orders: the admin order page shows "Follow up on WhatsApp" only if the customer ticked the WhatsApp box.

## Checkout (Razorpay)

- Funnel result → **Delivery and payment** step (contact, address, consent, optional WhatsApp marketing opt-in) → Razorpay Checkout → **Order confirmed** with reference `BBA-XXXXXXXX`.
- After payment is confirmed (verify or webhook), the staff PDF email is sent once (`src/lib/server/staffNotify.ts`, `orderPdf.ts`).
- `POST /api/checkout/create`: validates with zod, sets the price **on the server** (product price + purposes tier − coupon; partner attribution from the `bba_ref` cookie), rate-limited, 8 KB body cap, creates the Razorpay order with the customer's details in its notes, saves a pending row in Postgres (Neon) when `DATABASE_URL` is set. All SQL is parameterised; updates are idempotent.
- `POST /api/checkout/verify`: checks the Checkout signature (HMAC) and re-fetches the payment from Razorpay to confirm order, amount and status before marking paid.
- `POST /api/razorpay/webhook`: verifies `X-Razorpay-Signature` on the raw body; idempotent updates so Razorpay retries are safe.
- Prepaid only (no COD), free shipping, delivery days from Settings.
- Without Razorpay keys the funnel falls back to the pre-filled Google order form.

## Product photos

Drop photos into `public/products/<bracelet-slug>/1.jpg, 2.jpg, 3.jpg` (on wrist, close-up, packaging). They replace the illustrations on the bracelet page and homepage hover cards on the next deploy, and are added to the product's structured data. See `public/products/README.txt`.

## Videos

`src/data/videos.ts` maps Ammit's YouTube Shorts to bracelet, care and about pages. They're click-to-play (nothing loads from YouTube until pressed) using the privacy-enhanced nocookie player. Reels featuring celebrities or public figures are deliberately excluded; Ammit should confirm each video before launch.

## Find-your-bracelet funnel

`src/components/funnel/Funnel.tsx` (client component), `src/lib/numerology.ts`, `src/lib/orderForm.ts`.

- One question per screen, progress bar, back arrow and browser back/forward (`?step=` in the URL; UTM parameters are preserved).
- Steps: who it's for → gender → up to 3 purposes → focus → a real review → name → date of birth (rejects impossible dates; under-18 wearers need a parent/guardian tick) → mulank & bhagyank reveal → wrist size → matching → result → checkout → confirmed.
- The first purpose picked is the bracelet; the others are added as extra purposes (priced by the tiers above).
- Without Razorpay keys, **Confirm my order** opens the Google order form pre-filled (`src/lib/orderForm.ts`).
- Answers are held in memory only (no cookies, storage or analytics) until the visitor chooses to open the form or WhatsApp.
- No countdowns, fake scarcity or invented social proof.

**Before public launch:** because the site now hands visitors to a form that collects personal data, a privacy policy page is required (pre-launch audit L1). Suggested form fixes: add a "3 in 1" purpose option and a "Website" option under "Referred by".

## Structure

```
src/
  app/
    layout.tsx       fonts (Cormorant Garamond + Nunito Sans via next/font), metadata
    page.tsx         homepage: assembles the sections in order
    globals.css      all styling: colour tokens + one block per section
  components/        one file per section
    Loader.tsx           brand intro ("Bracelet By Ammit" → BBA), CSS-only
    AnnouncementBar.tsx  top lapis strip
    SiteHeader.tsx       sticky nav / logo / bag + mobile hamburger drawer (client component)
    Hero.tsx             headline + rotating crystal bracelet
    IntentionEdit.tsx    10 purpose rows with hover photo fan
    MadeForYou.tsx       "made for you" notes + Instagram reel (InstagramReel.tsx)
    LangSwitch.tsx       English · हिन्दी · Hinglish switcher
    NoteFromAmmit.tsx    note card + quote
    Gifts.tsx            3 arched gift cards
    Testimonials.tsx     customer reviews (grid on desktop, swipe row on mobile)
    CareSection.tsx      "What if my bracelet breaks?" + care list
    SiteFooter.tsx       WhatsApp CTA + footer links
    Medallion.tsx        lapis circle with the BBA emblem
  data/home.ts       ALL copy, prices, links and per-item colours
public/brand/        emblem.png, wordmark.png
```

## Before launch: still needed from the client

- **Ammit's portrait**: in place at `public/ammit/ammit-kukreja.jpg`. Confirm Ammit approves it as his portrait.
- **Reviews**: three real customer messages from the Instagram "Reviews" highlight are on the site (`TESTIMONIALS` in `src/data/home.ts`), each linked to its source. Ask the client to confirm he's happy to reuse them; reviews claiming health results were deliberately left out.
- **Product photos**: Ammit's own photos are in `public/products/` (see `CREDITS.txt`). Better married life, 3 in 1 and the gifts borrow the closest photos until he sends dedicated ones.
- **Approve the copy**: Ammit's note, care instructions, gift blurbs and footer disclaimer were drafted for his review.
- **Shipping & payments (placeholder decisions by Mayank, 24 Oct)**: free shipping, prepaid only, 5–7 days, refunds started within 7 working days. Confirm with Ammit.
- **Business details** (`BUSINESS` in `src/data/home.ts`): the footer shows brand, founder, WhatsApp contact and grievance officer (Ammit Kukreja, Founder; client to confirm). Still needed before selling online: legal entity name, registered address, email/phone and GSTIN. Empty fields are hidden automatically.
- **Ammit to confirm:** crystals listed for the new purposes (clarity & confidence, self healing, delay in marriage, weight loss) and the wording on the health / weight-loss pages.
- **Hindi copy:** review by a native speaker.

## Notes

- Everything is server-rendered and static. The only client JavaScript is the header: the compact-on-scroll state and the mobile menu (focus trap, Esc to close, scroll lock).
- The header is sticky; `scroll-padding-top` on `html` keeps anchored headings clear of it. Below 960px it switches to hamburger / logo / bag.
- The loader plays on every load. Set `SHOW_LOADER = false` in `data/home.ts` to turn it off. It is skipped automatically for `prefers-reduced-motion`.
- The only departure from the mockup: the hero bracelet scales down below 548px wide, because the mockup clipped it on phones.
