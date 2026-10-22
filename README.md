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
| `NEXT_PUBLIC_SITE_LIVE` | at launch | Set to `true` **only when launching**. Until then every deployment sends `noindex` and robots.txt blocks crawlers. |

## Security and SEO built in

- Security headers on every response (`next.config.ts`): HSTS, CSP (same-origin only), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy; `x-powered-by` removed.
- `robots.txt`, `sitemap.xml`, canonical URL, Open Graph/Twitter card with `src/app/opengraph-image.png`, app icons.
- Branded 404 page (`src/app/not-found.tsx`), skip-to-content link, axe-clean at desktop and mobile widths.
- If you add analytics, a chat widget, embeds or forms later, add their domains to the CSP and add a privacy policy + cookie consent first.

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
- **Shipping and returns**: delivery time, shipping charges and returns policy. Add a page and footer link once known.
- **Business details** (`BUSINESS` in `src/data/home.ts`): the footer shows brand, founder, WhatsApp contact and grievance officer (Ammit Kukreja, Founder; client to confirm). Still needed before selling online: legal entity name, registered address, email/phone and GSTIN. Empty fields are hidden automatically.
- Prices are `PRICE` (₹1,199) in `src/data/home.ts`. Ordering is WhatsApp-only, so every Choose/Build/Consultation/Order action opens WhatsApp.

## Notes

- Everything is server-rendered and static. The only client JavaScript is the header: the compact-on-scroll state and the mobile menu (focus trap, Esc to close, scroll lock).
- The header is sticky; `scroll-padding-top` on `html` keeps anchored headings clear of it. Below 960px it switches to hamburger / logo / bag.
- The loader plays on every load. Set `SHOW_LOADER = false` in `data/home.ts` to turn it off. It is skipped automatically for `prefers-reduced-motion`.
- The only departure from the mockup: the hero bracelet scales down below 548px wide, because the mockup clipped it on phones.
