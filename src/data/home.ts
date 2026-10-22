// All homepage copy, links and per-item colours live here so the
// components stay presentational.
//
// Ordering is WhatsApp-only for now (no cart/checkout), so every "Choose",
// "Build" and "Consultation" action opens WhatsApp. When a shop exists,
// point these at product pages instead.

export const LINKS = {
  whatsapp: "https://wa.me/message/ENJCQVDZ2QU4L1",
  youtube: "https://www.youtube.com/@braceletbyammit",
  youtubeShorts: "https://www.youtube.com/@braceletbyammit/shorts",
  instagram: "https://www.instagram.com/braceletbyammit/",
  instagramReviews: "https://www.instagram.com/braceletbyammit/",
} as const;

/** Every bracelet is the same price for now. */
export const PRICE = "₹1,199";

/**
 * Shown in the footer. Needed because the site describes health, relationship
 * and money outcomes. Have the client (and ideally a lawyer) approve the wording.
 */
export const FOOTER_DISCLAIMER =
  "Crystal and numerology guidance reflects traditional belief and personal experience. It is not a substitute for medical, psychological, legal or financial advice. Results vary from person to person.";

/** Show the brand intro loader on page load. */
export const SHOW_LOADER = true;

export type Intention = {
  slug: string;
  title: string;
  blurb: string;
  price: string;
  /** Where "Choose" goes — WhatsApp until product pages exist */
  href: string;
  /** Base bead colour of the sphere in the row */
  sphere: string;
  /** Edge shade of the sphere (rgba) */
  sphereShade: string;
  /** Highlight opacity on the sphere (0.85 for dark stones, .95 otherwise) */
  sphereGloss?: number;
  /** Three photo-card background gradients: [card1, card3, card2] */
  cards: [string, string, string];
  /** Three bead-ring colour triplets for the cards: [card1, card3, card2] */
  rings: [[string, string, string], [string, string, string], [string, string, string]];
};

export const INTENTIONS: Intention[] = [
  {
    slug: "married-life",
    title: "Better married life",
    blurb: "Patience, warmth and fewer arguments at home.",
    price: PRICE,
    href: LINKS.whatsapp,
    sphere: "#F2A7A0",
    sphereShade: "rgba(120,20,40,.35)",
    cards: [
      "linear-gradient(160deg,#FBE9EA,#F2C9CC)",
      "linear-gradient(200deg,#FFF4F0,#F4D6CF)",
      "linear-gradient(180deg,#F6EEF0,#E9D3D8)",
    ],
    rings: [
      ["#F2A7A0", "#FFFFFF", "#8E1F3A"],
      ["#8E1F3A", "#F2A7A0", "#FFFFFF"],
      ["#FFFFFF", "#8E1F3A", "#F2A7A0"],
    ],
  },
  {
    slug: "buri-nazar",
    title: "Buri nazar protection",
    blurb: "A shield against the evil eye for you and your family.",
    price: PRICE,
    href: LINKS.whatsapp,
    sphere: "#1C1C26",
    sphereShade: "rgba(0,0,0,.45)",
    sphereGloss: 0.85,
    cards: [
      "linear-gradient(160deg,#E3E6F2,#C3C8DE)",
      "linear-gradient(200deg,#E8EAF4,#CDD1E4)",
      "linear-gradient(180deg,#DDE1EE,#B6BCD6)",
    ],
    rings: [
      ["#16161E", "#1B4FD8", "#3A3A4A"],
      ["#1B4FD8", "#16161E", "#16161E"],
      ["#3A3A4A", "#16161E", "#1B4FD8"],
    ],
  },
  {
    slug: "studies",
    title: "Better studies",
    blurb: "Focus, memory and calm before exams.",
    price: PRICE,
    href: LINKS.whatsapp,
    sphere: "#7A3FC0",
    sphereShade: "rgba(40,10,70,.45)",
    cards: [
      "linear-gradient(160deg,#EEE6F8,#D6C6EE)",
      "linear-gradient(200deg,#F1ECF9,#DCD0F0)",
      "linear-gradient(180deg,#E9E1F6,#CFBDEA)",
    ],
    rings: [
      ["#7A3FC0", "#6BBFA3", "#EDEFF5"],
      ["#6BBFA3", "#7A3FC0", "#7A3FC0"],
      ["#EDEFF5", "#7A3FC0", "#6BBFA3"],
    ],
  },
  {
    slug: "health-healing",
    title: "Health and mental healing",
    blurb: "Support for body and mind while you recover.",
    price: PRICE,
    href: LINKS.whatsapp,
    sphere: "#2E9E4F",
    sphereShade: "rgba(10,50,20,.4)",
    cards: [
      "linear-gradient(160deg,#E3F1E7,#C3E0CB)",
      "linear-gradient(200deg,#EAF4ED,#CFE6D6)",
      "linear-gradient(180deg,#DDEEE2,#B7D9C1)",
    ],
    rings: [
      ["#2E9E4F", "#EDEFF5", "#7A3FC0"],
      ["#EDEFF5", "#2E9E4F", "#2E9E4F"],
      ["#7A3FC0", "#2E9E4F", "#EDEFF5"],
    ],
  },
  {
    slug: "love",
    title: "Love and relationships",
    blurb: "Attract the right person, or bring closeness back.",
    price: PRICE,
    href: LINKS.whatsapp,
    sphere: "#D96B86",
    sphereShade: "rgba(110,20,50,.38)",
    cards: [
      "linear-gradient(160deg,#FBE4EA,#F1C2CF)",
      "linear-gradient(200deg,#FDEDF1,#F4CFD9)",
      "linear-gradient(180deg,#F8DDE5,#EDB5C5)",
    ],
    rings: [
      ["#D96B86", "#F7D7DA", "#F2A7A0"],
      ["#F2A7A0", "#D96B86", "#D96B86"],
      ["#F7D7DA", "#D96B86", "#F2A7A0"],
    ],
  },
  {
    slug: "career-money",
    title: "Career and money",
    blurb: "Growth at work, steady income, sharper decisions.",
    price: PRICE,
    href: LINKS.whatsapp,
    sphere: "#E7B32A",
    sphereShade: "rgba(110,70,10,.4)",
    cards: [
      "linear-gradient(160deg,#FAF0D6,#EBD49A)",
      "linear-gradient(200deg,#FBF4E2,#EFDCAC)",
      "linear-gradient(180deg,#F7EACB,#E6CB86)",
    ],
    rings: [
      ["#E7B32A", "#A0602A", "#B8913D"],
      ["#A0602A", "#E7B32A", "#E7B32A"],
      ["#B8913D", "#E7B32A", "#A0602A"],
    ],
  },
];

/** Bead colours cycling around the hero bracelet */
export const HERO_BEADS = ["#050E8F", "#DCE0EE", "#7A3FC0"] as const;

/** Ring colours in the "3 in 1" band: love, protection, prosperity */
export const THREE_IN_ONE_RINGS = ["#F2A7A0", "#16161E", "#E7B32A"] as const;

export const MULANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const GIFTS = [
  {
    title: "Rakhi for brother, sister and bhabhi",
    blurb: "Send each sibling's date of birth and every rakhi is read for them, not just for the day.",
    alt: "Illustration of a red, gold and blush crystal rakhi bracelet",
    gradient: "linear-gradient(170deg,#F7D7DA,#DCE0EE)",
    beads: ["#8E1F3A", "#E7B32A", "#F2A7A0"],
    href: LINKS.whatsapp,
  },
  {
    title: "For your mother",
    blurb: "Chosen for her numbers: calm, health and protection for the woman who looks after everyone.",
    alt: "Illustration of a rose quartz, amethyst and moonstone bracelet",
    gradient: "linear-gradient(170deg,#E6DAF6,#DCE0EE)",
    beads: ["#D96B86", "#7A3FC0", "#EDEFF5"],
    href: LINKS.whatsapp,
  },
  {
    title: "For an anniversary",
    blurb: "A pair read from both your birth dates, so the crystals support the two of you together.",
    alt: "Illustration of a matching pair of rose and gold crystal bracelets",
    gradient: "linear-gradient(170deg,#F4ECC8,#DCE0EE)",
    beads: ["#F2A7A0", "#E7B32A", "#050E8F"],
    href: LINKS.whatsapp,
  },
] as const;

export const CARE = [
  {
    term: "Cleansing",
    detail:
      "Once a week, hold the bracelet in a bowl of dry rock salt or under a stream of smoke from a diya or incense for a few minutes. Avoid soaking it in water: some crystals fade or crack.",
  },
  {
    term: "Recharging",
    detail:
      "Leave it on a windowsill overnight under the full moon; this suits almost every crystal. Morning sunlight is fine for citrine, tiger eye and pyrite, but keep amethyst and rose quartz out of strong sun so their colour stays.",
  },
  {
    term: "Restringing",
    detail:
      "If the thread breaks, collect every bead and don't throw any away. Send us a photo on WhatsApp and we'll tell you how to send them back so Ammit can restring the same crystals for you.",
  },
] as const;

export type Testimonial = {
  /** The customer's own words (lightly edited for spelling only). */
  quote: string;
  name: string;
  place?: string;
  /** Slug from INTENTIONS, only when we know which bracelet they wear. */
  intention?: Intention["slug"];
  /** Where the review was originally posted, so it can be traced. */
  source?: { label: string; href: string };
};

const REVIEWS_HIGHLIGHT = "https://www.instagram.com/stories/highlights/17972703031853261/";

// Real customer messages, published by Bracelet By Ammit in the "Reviews"
// highlight on Instagram. Names are shown only where the customer's first name
// already appeared publicly. Reviews describing health outcomes were left out
// on purpose (advertising rules on health claims).
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Thank you sir for the bracelet which you have made especially for me. It is making things easier for me. People and situations are changing for me, and I'm feeling more positive than ever. Thank you so much.",
    name: "Customer on WhatsApp",
    source: { label: "Shared on Instagram", href: REVIEWS_HIGHLIGHT },
  },
  {
    quote:
      "Aapse bracelet liya hai, 1 month hone ko aaya hai. Positive ho rahi hoon, thoughts ki clarity ho rahi hai, study mein mann lag raha hai. I'm so grateful.",
    name: "Customer on WhatsApp",
    source: { label: "Shared on Instagram", href: REVIEWS_HIGHLIGHT },
  },
  {
    quote:
      "Aap jo bracelet banate ho, woh bahut achhe hain. Mujh par bracelet ka bahut hi achha asar ho raha hai. Main family ke liye aur bracelet lene wali hoon. Thank you so much.",
    name: "Kavita",
    source: { label: "Shared on Instagram", href: REVIEWS_HIGHLIGHT },
  },
];

export const AMMIT = {
  name: "Ammit Kukreja",
  role: "Numerologist, Bracelet By Ammit",
  /**
   * Drop the portrait at public/ammit/ammit-kukreja.jpg (portrait, ~4:5,
   * at least 800px wide). The note section picks it up automatically on the
   * next build; until then it shows the BBA medallion in the frame.
   */
  photo: "/ammit/ammit-kukreja.jpg",
  photoAlt: "Ammit Kukreja, numerologist and founder of Bracelet By Ammit",
} as const;

/**
 * Business details shown in the footer (Consumer Protection (E-Commerce)
 * Rules, 2020). Empty fields are not rendered. Fill in the legal entity,
 * registered address, email/phone and GSTIN before selling online.
 */
export const BUSINESS: {
  brand: string;
  legalName: string;
  founder: string;
  address: string;
  email: string;
  phone: string;
  gstin: string;
  grievanceOfficer: { name: string; designation: string };
} = {
  brand: "Bracelet By Ammit",
  legalName: "", // e.g. "Ammit Kukreja (Proprietor)" or the registered company name
  founder: "Ammit Kukreja, Numerologist",
  address: "",
  email: "",
  phone: "",
  gstin: "",
  grievanceOfficer: { name: "Ammit Kukreja", designation: "Founder" },
};
