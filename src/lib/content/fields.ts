import type { PageId } from "./defaults";

/** How each editable value is shown in the admin panel. */
export type FieldType = "text" | "textarea" | "markdown" | "list" | "number" | "toggle" | "url" | "image" | "color" | "repeater";

export type SubField = { key: string; label: string; type: Exclude<FieldType, "repeater" | "markdown">; shared?: boolean };

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  /** repeater only */
  fields?: SubField[];
  itemLabel?: string;
  /** repeater: items can't be added or removed (e.g. mulank 1–9) */
  fixed?: boolean;
  /** Same in every language (not translated), e.g. phone numbers or customers' own words */
  shared?: boolean;
};

export type PageDef = {
  id: PageId;
  title: string;
  group: "Site" | "Pages" | "Policies";
  /** Public page to preview */
  path?: string;
  sections: { title: string; fields: FieldDef[] }[];
};

const t = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: "text", help });
const ta = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: "textarea", help });
const md = (key: string, label: string, help?: string): FieldDef => ({ key, label, type: "markdown", help });
const list = (key: string, label: string, help = "One item per line."): FieldDef => ({ key, label, type: "list", help });
const seo = (): { title: string; fields: FieldDef[] } => ({
  title: "Search engines",
  fields: [t("seoTitle", "Page title in Google", "Leave empty to use the default."), ta("seoDescription", "Description in Google")],
});

const PH = "You can use {{price}}, {{phone}}, {{address}}, {{minDays}}, {{maxDays}}.";
const MD_HELP =
  "Formatting: ## Heading, ### Smaller heading, - bullet, 1. numbered, **bold**, *italic*, [link text](/page or https://…). Placeholders: {{legalName}}, {{founder}}, {{phone}}, {{address}}, {{email}}, {{grievance}}, {{disclaimer}}, {{minDays}}, {{maxDays}}, {{price}}.";

export const PAGES: PageDef[] = [
  {
    id: "settings",
    title: "Site settings",
    group: "Site",
    sections: [
      {
        title: "Business details (footer, policies, Google)",
        fields: [
          t("brand", "Brand name"),
          t("legalName", "Legal / business name"),
          t("founder", "Founder line"),
          ta("address", "Address"),
          t("phone", "Phone"),
          t("email", "Business email"),
          t("gstin", "GSTIN", "Leave empty if not registered."),
          t("grievanceName", "Grievance officer name"),
          t("grievanceDesignation", "Grievance officer designation"),
        ],
      },
      {
        title: "Prices and delivery",
        fields: [
          { key: "defaultPrice", label: "Price: 1 purpose in 1 bracelet (₹)", type: "number", help: "Shown on the site, and the starting price for new products." },
          { key: "price2", label: "Price: 2 purposes in 1 bracelet (₹)", type: "number", help: "Offered at checkout and after payment, never shown upfront." },
          { key: "price3", label: "Price: 3 purposes in 1 bracelet (₹)", type: "number" },
          { key: "shippingMinDays", label: "Delivery: from (days)", type: "number" },
          { key: "shippingMaxDays", label: "Delivery: to (days)", type: "number" },
        ],
      },
      {
        title: "Links",
        fields: [
          { key: "whatsapp", label: "WhatsApp link", type: "url" },
          { key: "instagram", label: "Instagram", type: "url" },
          { key: "youtube", label: "YouTube channel", type: "url" },
          { key: "youtubeShorts", label: "YouTube Shorts", type: "url" },
          { key: "reelUrl", label: "Instagram reel on the homepage", type: "url", help: "Link to a reel, e.g. https://www.instagram.com/reel/…" },
          { key: "instagramReviews", label: "Instagram reviews highlight", type: "url" },
        ],
      },
      {
        title: "Site-wide text",
        fields: [
          t("announcement", "Announcement bar"),
          t("announcementLink", "Announcement link text", "Links to the consultation page."),
          ta("disclaimer", "Disclaimer (footer and terms)"),
          t("refNote", "Line on every product photo"),
          { key: "showLoader", label: "Show the BBA intro animation on the homepage", type: "toggle" },
        ],
      },
      {
        title: "Ammit",
        fields: [
          t("ammitName", "Name"),
          t("ammitRole", "Role line"),
          { key: "ammitPhoto", label: "Portrait", type: "image" },
          t("ammitPhotoAlt", "Portrait description (for screen readers)"),
        ],
      },
      {
        title: "Order emails",
        fields: [
          t("staffEmails", "Send the staff order PDF to", "Comma-separated email addresses. Needs the email service key in Vercel."),
        ],
      },
      {
        title: "Search engines (homepage and default)",
        fields: [t("seoTitle", "Site title in Google"), ta("seoDescription", "Site description in Google")],
      },
    ],
  },
  {
    id: "home",
    title: "Homepage",
    group: "Pages",
    path: "/",
    sections: [
      { title: "Hero", fields: [ta("heroTitle", "Headline"), ta("heroLede", "Intro"), t("heroPrimary", "Main button"), t("heroSecondary", "Second button")] },
      { title: "Intention list", fields: [t("editTitle", "Heading"), t("editLede", "Intro", PH), t("editHintHover", "Hint on computers"), t("editHintTouch", "Hint on phones")] },
      {
        title: "Made for you (with Ammit's reel)",
        fields: [
          t("madeTitle", "Heading"),
          ta("madeText", "Text"),
          list("madePoints", "Points"),
          ta("madeNote", "Note under the points"),
          t("madeButton", "Button"),
          t("madeReelTitle", "Reel title"),
          t("madeReelNote", "Small line under the reel title"),
          { key: "madeReelCover", label: "Reel cover photo (shown until the visitor presses play)", type: "image" },
        ],
      },
      {
        title: "Note from Ammit",
        fields: [t("noteTitle", "Heading"), ta("noteBody1", "First paragraph"), ta("noteBody2", "Second paragraph"), ta("noteQuote", "Quote"), t("noteButton", "Button"), t("noteReadMore", "Read more link (homepage)")],
      },
      { title: "Reviews", fields: [t("reviewsTitle", "Heading"), ta("reviewsLede", "Intro"), t("reviewsMore", "Instagram button")] },
      { title: "Care", fields: [t("careTitle", "Heading"), ta("careText", "Text"), t("careWatch", "Video button"), t("careGuide", "Guide button")] },
      seo(),
    ],
  },
  {
    id: "shared",
    title: "Header, footer and shared blocks",
    group: "Site",
    sections: [
      {
        title: "Footer",
        fields: [t("footerKicker", "Small line above the heading"), t("footerTitle", "Heading"), ta("footerText", "Text"), t("footerOrder", "Order button"), t("footerWhatsapp", "WhatsApp button"), t("footerTagline", "Tagline")],
      },
      { title: "Order band (bottom of most pages)", fields: [t("ctaTitle", "Default heading"), ta("ctaText", "Default text"), t("ctaButton", "Button")] },
      {
        title: "How your bracelet is made",
        fields: [
          t("howTitle", "Heading"),
          { key: "howSteps", label: "Steps", type: "repeater", itemLabel: "Step", fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }] },
        ],
      },
      { title: "Trust bar", fields: [t("trustShipping", "Shipping line"), t("trustPayment", "Payment line")] },
      { title: "Page not found", fields: [t("notFoundTitle", "Heading"), ta("notFoundText", "Text")] },
    ],
  },
  {
    id: "product",
    title: "Bracelet pages (shared text)",
    group: "Pages",
    path: "/bracelets/studies",
    sections: [
      {
        title: "Labels",
        fields: [
          t("eyebrow", "Small heading"),
          t("priceNote", "Next to the price"),
          t("orderButton", "Order button"),
          t("askButton", "Second button"),
          t("hint", "Line under the buttons"),
          t("aboutTitle", "About heading"),
          t("videoTitle", "Video heading"),
          t("forWhomTitle", "\"For you if\" heading"),
          t("crystalsTitle", "Crystals heading"),
          ta("crystalsNote", "Crystals note"),
          t("othersTitle", "Other bracelets heading"),
        ],
      },
      {
        title: "Questions (shown on every bracelet page)",
        fields: [
          t("faqTitle", "Heading"),
          { key: "faqs", label: "Questions", type: "repeater", itemLabel: "Question", fields: [{ key: "q", label: "Question ({title} = bracelet name)", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
        ],
      },
    ],
  },
  {
    id: "about",
    title: "About Ammit",
    group: "Pages",
    path: "/about-ammit",
    sections: [
      { title: "Page", fields: [t("eyebrow", "Small heading"), t("title", "Heading"), ta("lede", "Intro"), t("videoTitle", "Video heading"), t("videoId", "YouTube video ID", "The code after youtube.com/shorts/ or watch?v="), t("workTitle", "Work heading")] },
      {
        title: "What Ammit does",
        fields: [
          {
            key: "work",
            label: "Cards",
            type: "repeater",
            itemLabel: "Card",
            fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }, { key: "cta", label: "Link text", type: "text" }, { key: "href", label: "Link", type: "url" }],
          },
          t("ctaTitle", "Bottom band heading"),
        ],
      },
      seo(),
    ],
  },
  {
    id: "consultation",
    title: "Consultation",
    group: "Pages",
    path: "/consultation",
    sections: [
      { title: "Page", fields: [t("eyebrow", "Small heading"), t("title", "Heading"), ta("lede", "Intro"), t("button", "Button"), t("coversTitle", "\"What we cover\" heading"), list("covers", "What we cover"), t("stepsTitle", "\"How to book\" heading"), list("steps", "How to book"), ta("callout", "Note"), t("ctaTitle", "Bottom band heading"), ta("ctaText", "Bottom band text")] },
      seo(),
    ],
  },
  {
    id: "care",
    title: "Bracelet care",
    group: "Pages",
    path: "/bracelet-care",
    sections: [
      { title: "Page", fields: [t("eyebrow", "Small heading"), t("title", "Heading"), ta("lede", "Intro")] },
      {
        title: "Care cards (also on the homepage)",
        fields: [{ key: "items", label: "Cards", type: "repeater", itemLabel: "Card", fields: [{ key: "term", label: "Title", type: "text" }, { key: "detail", label: "Text", type: "textarea" }] }],
      },
      { title: "Do and don't", fields: [t("dosTitle", "Do heading"), list("dos", "Do"), t("dontsTitle", "Don't heading"), list("donts", "Don't")] },
      { title: "If it breaks", fields: [t("breakTitle", "Heading"), md("breakText", "Text", MD_HELP), t("videoId", "YouTube video ID"), t("ctaTitle", "Bottom band heading"), ta("ctaText", "Bottom band text")] },
      seo(),
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    group: "Pages",
    path: "/reviews",
    sections: [
      { title: "Page", fields: [t("eyebrow", "Small heading"), t("title", "Heading"), ta("lede", "Intro"), t("ctaTitle", "Bottom band heading"), ta("ctaText", "Bottom band text")] },
      {
        title: "Instagram review screenshots (shown instead of written reviews once added)",
        fields: [
          t("shotsTitle", "Heading on the reviews page"),
          {
            key: "shots",
            shared: true,
            label: "Screenshots",
            help: "Add this week's screenshots from Instagram reviews or highlights. Newest first. Type what the review says so screen readers and Google can read it.",
            type: "repeater",
            itemLabel: "Screenshot",
            fields: [
              { key: "image", label: "Screenshot", type: "image" },
              { key: "name", label: "Customer name or handle (optional)", type: "text" },
              { key: "text", label: "What the review says", type: "textarea" },
              { key: "link", label: "Link to the post or highlight (optional)", type: "url" },
            ],
          },
        ],
      },
      {
        title: "Written reviews (used until screenshots are added)",
        fields: [
          {
            key: "items",
            shared: true,
            label: "Reviews",
            type: "repeater",
            itemLabel: "Review",
            fields: [
              { key: "quote", label: "Their words", type: "textarea" },
              { key: "name", label: "Name", type: "text" },
              { key: "intention", label: "Bracelet they wear (web address, e.g. love-life; optional)", type: "text" },
              { key: "sourceLabel", label: "Source label", type: "text" },
              { key: "sourceUrl", label: "Source link", type: "url" },
            ],
          },
        ],
      },
      seo(),
    ],
  },
  {
    id: "funnel",
    title: "60-second reading",
    group: "Pages",
    path: "/find-your-bracelet",
    sections: [
      { title: "Start", fields: [t("introKicker", "Small heading"), t("introTitle", "Heading"), ta("introText", "Intro"), ta("introFine", "Small print")] },
      {
        title: "Questions",
        fields: [
          t("genderTitle", "Gender question"),
          t("genderText", "Gender help"),
          t("intentionTitle", "Intention question"),
          t("intentionTitleGift", "Intention question (gift)"),
          t("proofTitle", "Review step heading"),
          ta("proofText", "Review step text"),
          t("nameTitle", "Name question"),
          t("nameTitleGift", "Name question (gift)"),
          ta("nameText", "Name help"),
          t("dobText", "Date of birth help"),
          t("wristTitle", "Wrist question"),
          t("wristTitleGift", "Wrist question (gift)"),
          t("wristText", "Wrist help"),
          t("matchingTitle", "Matching screen heading"),
        ],
      },
      { title: "Result and checkout", fields: [list("nextSteps", "What happens next", "One step per line. " + PH), t("checkoutTitle", "Checkout heading"), ta("confirmedText", "Thank-you text", "{title} = bracelet, {ref} = order number")] },
      seo(),
    ],
  },
  {
    id: "sizeGuide",
    title: "Size guide",
    group: "Pages",
    path: "/size-guide",
    sections: [
      {
        title: "Page",
        fields: [
          t("eyebrow", "Small heading"),
          t("title", "Heading"),
          ta("lede", "Intro"),
          t("measureTitle", "Measuring heading"),
          list("measureSteps", "Measuring steps"),
          t("sizesTitle", "Sizes heading"),
          { key: "sizes", label: "Sizes", type: "repeater", itemLabel: "Size", fields: [{ key: "label", label: "Fit", type: "text" }, { key: "women", label: "Women", type: "text" }, { key: "men", label: "Men", type: "text" }] },
          md("note", "Note under the table", MD_HELP),
          t("ctaTitle", "Bottom band heading"),
        ],
      },
      seo(),
    ],
  },
  {
    id: "mulank",
    title: "Mulank meanings (60-second reading)",
    group: "Pages",
    path: "/find-your-bracelet",
    sections: [
      {
        title: "Numbers (shown when the reading reveals the customer's mulank)",
        fields: [
          {
            key: "numbers",
            label: "Mulank",
            type: "repeater",
            itemLabel: "Mulank",
            fixed: true,
            fields: [
              { key: "number", label: "Number", type: "number" },
              { key: "planet", label: "Planet", type: "text" },
              { key: "planetHindi", label: "Planet (second name, shown in brackets)", type: "text" },
              { key: "traits", label: "Qualities (one per line)", type: "list" },
            ],
          },
        ],
      },
    ],
  },
  ...(["privacy", "terms", "shipping", "returns"] as const).map(
    (id): PageDef => ({
      id,
      title: { privacy: "Privacy policy", terms: "Terms of use", shipping: "Shipping policy", returns: "Returns policy" }[id],
      group: "Policies",
      path: `/${id}`,
      sections: [{ title: "Policy", fields: [t("title", "Heading"), ta("lede", "Intro", PH), t("updated", "Last updated (date shown)"), md("body", "Policy text", MD_HELP)] }],
    }),
  ),
];

export const pageDef = (id: string) => PAGES.find((p) => p.id === id);

/* ------------------------------------------------------------------ */
/* Languages: which values are translated and which are shared          */
/* ------------------------------------------------------------------ */

const SHARED_TYPES = new Set<FieldType>(["number", "url", "image", "color", "toggle"]);
const SHARED_KEYS = new Set(["videoId", "href", "link", "slug", "intention", "sourceUrl", "number", "staffEmails"]);
/** Site settings that are the same in every language. */
const SHARED_SETTINGS = new Set(["brand", "legalName", "address", "phone", "email", "gstin", "grievanceName", "ammitName", "staffEmails"]);

export function fieldIsShared(page: string, f: FieldDef) {
  return !!f.shared || SHARED_TYPES.has(f.type) || SHARED_KEYS.has(f.key) || (page === "settings" && SHARED_SETTINGS.has(f.key));
}
export const subIsShared = (sf: SubField) => !!sf.shared || SHARED_TYPES.has(sf.type) || SHARED_KEYS.has(sf.key);
