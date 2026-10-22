# Bracelet By Ammit — website (Next.js)

Homepage built from design concept **3F · Intention Royal (3 hero + 3E)**.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Requires Node 20+.

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
    SiteHeader.tsx       nav / logo / bag
    Hero.tsx             headline + rotating crystal bracelet
    IntentionEdit.tsx    6 intention rows with hover photo fan
    ThreeInOne.tsx       "Three intentions, one bracelet" band
    MulankPicker.tsx     numbers 1–9
    NoteFromAmmit.tsx    note card + quote
    Gifts.tsx            3 arched gift cards
    CareSection.tsx      "What if my bracelet breaks?" + care list
    SiteFooter.tsx       WhatsApp CTA + footer links
    Medallion.tsx        lapis circle with the BBA emblem
  data/home.ts       ALL copy, prices, links and per-item colours
public/brand/        emblem.png, wordmark.png
```

## Before launch: placeholders to replace (all in `src/data/home.ts` unless noted)

- `[₹ PRICE]` on the six intentions
- `href: "#"` links: product pages, Consultation, Bag, Build my bracelet, Build my 3 in 1, Shipping and returns, gift links
- Intention hover photos: `[Photo 1/2/3]`. Add real photos as `<Image className="ph-img" …/>` inside each card in `IntentionEdit.tsx`
- Gift photos: `[Rakhi bracelet photo]` etc. in `Gifts.tsx`
- Ammit's welcome text and signature in `NoteFromAmmit.tsx`
- Care copy (Cleansing / Recharging / Restringing)
- Mulank buttons link to `#mulank-n` for now. Point them at the number pages when they exist

## Notes

- Everything is server-rendered and static. No client JavaScript is needed for any animation or hover.
- The loader plays on every load. Set `SHOW_LOADER = false` in `data/home.ts` to turn it off. It is skipped automatically for `prefers-reduced-motion`.
- The only departure from the mockup: the hero bracelet scales down below 548px wide, because the mockup clipped it on phones.
