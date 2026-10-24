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
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | optional | Order database. Run `supabase/migrations/20261024000000_orders.sql` first. Without these, every order is still recorded in Razorpay (all details are in the order notes). |
| `NEXT_PUBLIC_GA_ID` | optional | Google Analytics 4 ID (G-…). Loads only after the visitor accepts cookies. |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional | Meta Pixel ID. Same consent rule. Funnel fires Lead and InitiateCheckout. |
| `NEXT_PUBLIC_SITE_LIVE` | at launch | Set to `true` **only when launching**. Until then every deployment sends `noindex` and robots.txt blocks crawlers. |

## Security and SEO built in

- Security headers on every response (`next.config.ts`): HSTS, CSP (same-origin only), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy; `x-powered-by` removed.
- `robots.txt`, `sitemap.xml`, canonical URL, Open Graph/Twitter card with `src/app/opengraph-image.png`, app icons.
- Branded 404 page (`src/app/not-found.tsx`), skip-to-content link, axe-clean at desktop and mobile widths.
- If you add analytics, a chat widget, embeds or forms later, add their domains to the CSP and add a privacy policy + cookie consent first.

## Pages and URLs

| URL | Page |
|---|---|
| `/` | Homepage |
| `/find-your-bracelet` | Quiz funnel: 7 questions → mulank/bhagyank → recommended bracelet → pre-filled Google order form |
| `/bracelets` | Shop by intention (all 7 bracelets) |
| `/bracelets/better-married-life` · `/buri-nazar-protection` · `/better-studies` · `/health-and-mental-healing` · `/love-and-relationships` · `/career-and-money` · `/3-in-1` | Bracelet pages (₹1,199, Order on WhatsApp, Product schema) |
| `/mulank` | Find your mulank |
| `/mulank/1` … `/mulank/9` | One page per number (planet, birth days, traits) |
| `/gifts` | Gifts |
| `/gifts/rakhi` · `/gifts/for-your-mother` · `/gifts/anniversary` | Gift pages |
| `/about-ammit` | About Ammit Kukreja (portrait frame, Person schema) |
| `/consultation` | Numerology consultation |
| `/bracelet-care` | Care guide (cleansing, recharging, restringing, do's and don'ts) |
| `/reviews` | Customer reviews |
| `/privacy` · `/terms` · `/shipping` · `/returns` | Policies (drafted from current practice; client to confirm terms marked below) |
| `/size-guide` | How to measure + size table (women 14/15/16 cm, men 16/17/18 cm) |
| `/numerology` · `/numerology/mulank-and-bhagyank` · `/numerology/lo-shu-grid` | Guides + free Lo Shu grid calculator with Ammit's combination videos |
| `/tools/reading-card` | **Staff only** (noindex, blocked in robots): print the personal reading card for each order or save it as PDF for WhatsApp |

All pages are static, have their own title/description/canonical, breadcrumbs (with BreadcrumbList schema) and are listed in `sitemap.xml`. Page copy lives in `src/data/pages.ts`; items marked **CONFIRM** there (crystals per intention, consultation details) need Ammit's sign-off.

## Checkout (Razorpay)

- Funnel result → **Delivery and payment** step (contact, address, consent, optional WhatsApp marketing opt-in) → Razorpay Checkout → **Order confirmed** with reference `BBA-XXXXXXXX`.
- `POST /api/checkout/create`: validates with zod, sets the price **on the server** (`PRICE_INR`), rate-limited, 8 KB body cap, creates the Razorpay order with the customer's details in its notes, saves a pending row if a database is configured.
- `POST /api/checkout/verify`: checks the Checkout signature (HMAC) and re-fetches the payment from Razorpay to confirm order, amount and status before marking paid.
- `POST /api/razorpay/webhook`: verifies `X-Razorpay-Signature` on the raw body; idempotent updates so Razorpay retries are safe.
- Prepaid only (no COD), free shipping, delivery 5–7 days (`SHIPPING` in `src/data/home.ts`).
- Without Razorpay keys the funnel falls back to the pre-filled Google order form.

## Product photos

Drop photos into `public/products/<bracelet-slug>/1.jpg, 2.jpg, 3.jpg` (on wrist, close-up, packaging). They replace the illustrations on the bracelet page and homepage hover cards on the next deploy, and are added to the product's structured data. See `public/products/README.txt`.

## Videos

`src/data/videos.ts` maps Ammit's YouTube Shorts to bracelet, mulank, care, about and Lo Shu pages. They're click-to-play (nothing loads from YouTube until pressed) using the privacy-enhanced nocookie player. Reels featuring celebrities or public figures are deliberately excluded; Ammit should confirm each video before launch.

## Find-your-bracelet funnel

`src/components/funnel/Funnel.tsx` (client component), `src/lib/numerology.ts`, `src/lib/orderForm.ts`.

- One question per screen, progress bar, back arrow and browser back/forward (`?step=` in the URL; UTM parameters are preserved).
- Steps: who it's for → gender → up to 3 intentions → focus → a real review → name → date of birth (rejects impossible dates; under-18 wearers need a parent/guardian tick) → mulank & bhagyank reveal → wrist size → matching → result.
- 2+ intentions within love / married life / buri nazar / career → recommends the **3 in 1**; otherwise the first intention picked.
- **Confirm my order** opens the Google order form pre-filled (name, birth date, gender, wrist size, purpose). Entry IDs and option labels live in `src/lib/orderForm.ts`; update them if the form changes.
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
    IntentionEdit.tsx    6 intention rows with hover photo fan
    ThreeInOne.tsx       "Three intentions, one bracelet" band
    MulankPicker.tsx     numbers 1–9
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

- **Ammit's portrait**: save it as `public/ammit/ammit-kukreja.jpg` (portrait, ~4:5, 800px+ wide). The note section switches from the medallion to the photo automatically.
- **Reviews**: three real customer messages from the Instagram "Reviews" highlight are on the site (`TESTIMONIALS` in `src/data/home.ts`), each linked to its source. Ask the client to confirm he's happy to reuse them; reviews claiming health results were deliberately left out.
- **Product photos**: 3 per intention (hover fan) and one per gift. Bead-ring illustrations are shown until then.
- **Approve the copy**: Ammit's note, care instructions, gift blurbs and footer disclaimer were drafted for his review.
- **Shipping & payments (placeholder decisions by Mayank, 24 Oct)**: free shipping, prepaid only, 5–7 days, refunds started within 7 working days. Confirm with Ammit.
- **Business details** (`BUSINESS` in `src/data/home.ts`): the footer shows brand, founder, WhatsApp contact and grievance officer (Ammit Kukreja, Founder; client to confirm). Still needed before selling online: legal entity name, registered address, email/phone and GSTIN. Empty fields are hidden automatically.
- Prices are `PRICE` (₹1,199) in `src/data/home.ts`. Ordering is WhatsApp-only, so every Choose/Build/Consultation/Order action opens WhatsApp.

## Notes

- Everything is server-rendered and static. The only client JavaScript is the header: the compact-on-scroll state and the mobile menu (focus trap, Esc to close, scroll lock).
- The header is sticky; `scroll-padding-top` on `html` keeps anchored headings clear of it. Below 960px it switches to hamburger / logo / bag.
- The loader plays on every load. Set `SHOW_LOADER = false` in `data/home.ts` to turn it off. It is skipped automatically for `prefers-reduced-motion`.
- The only departure from the mockup: the hero bracelet scales down below 548px wide, because the mockup clipped it on phones.
