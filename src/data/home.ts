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
  // Ammit's feedback highlight on Instagram (customer messages and photos)
  instagramReviews: "https://www.instagram.com/stories/highlights/18046452023799577/",
} as const;

/** Price of a bracelet made for one purpose (2 and 3 purposes are set in Settings). */
export const PRICE_INR = 1200;
export const PRICE = `₹${PRICE_INR.toLocaleString("en-IN")}`;

/** Shipping promise shown next to prices (confirmed by Ammit, 25 Oct 2026). */
export const SHIPPING = {
  free: true,
  prepaidOnly: true,
  minDays: 8,
  maxDays: 9,
} as const;

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

/** Builds the card gradients and bead rings from three bead colours and a soft card tint. */
function look(a: string, b: string, c: string, tint: [string, string]): Pick<Intention, "cards" | "rings"> {
  return {
    cards: [`linear-gradient(160deg,${tint[0]},${tint[1]})`, `linear-gradient(200deg,#FFFFFF,${tint[0]})`, `linear-gradient(180deg,${tint[0]},${tint[1]})`],
    rings: [
      [a, b, c],
      [b, a, a],
      [c, a, b],
    ],
  };
}

/**
 * The ten purposes (client's list, 28 Oct 2026). Order = order on the site.
 * Every bracelet is newly designed for the wearer; one purpose is the price
 * shown on the site, extra purposes are offered at checkout.
 */
export const INTENTIONS: Intention[] = [
  {
    slug: "career-and-finance",
    title: "Better Career & Finance",
    blurb: "Growth at work, steady income, sharper decisions.",
    price: PRICE,
    sphere: "#E7B32A",
    sphereShade: "rgba(110,70,10,.4)",
    ...look("#E7B32A", "#A0602A", "#B8913D", ["#FAF0D6", "#EBD49A"]),
  },
  {
    slug: "love-life",
    title: "Better Love Life",
    blurb: "Attract the right person, or bring closeness back.",
    price: PRICE,
    sphere: "#D96B86",
    sphereShade: "rgba(110,20,50,.38)",
    ...look("#D96B86", "#F7D7DA", "#F2A7A0", ["#FBE4EA", "#F1C2CF"]),
  },
  {
    slug: "clarity-and-confidence",
    title: "Clarity & Confidence",
    blurb: "A clearer head, firmer decisions and the courage to act.",
    price: PRICE,
    sphere: "#3D6FD9",
    sphereShade: "rgba(10,30,90,.42)",
    ...look("#3D6FD9", "#E7B32A", "#EDEFF5", ["#E4EBFA", "#C5D3F2"]),
  },
  {
    slug: "health",
    title: "Health",
    blurb: "Support for body and mind, day to day and while you recover.",
    price: PRICE,
    sphere: "#2E9E4F",
    sphereShade: "rgba(10,50,20,.4)",
    ...look("#2E9E4F", "#EDEFF5", "#7A3FC0", ["#E3F1E7", "#C3E0CB"]),
  },
  {
    slug: "buri-nazar",
    title: "Buri Nazar & Protection from Negative Energies",
    blurb: "A shield against the evil eye and negativity, for you and your family.",
    price: PRICE,
    sphere: "#1C1C26",
    sphereShade: "rgba(0,0,0,.45)",
    sphereGloss: 0.85,
    ...look("#16161E", "#1B4FD8", "#3A3A4A", ["#E3E6F2", "#C3C8DE"]),
  },
  {
    slug: "self-healing",
    title: "Self Healing",
    blurb: "Calm, inner balance and letting go of what weighs on you.",
    price: PRICE,
    sphere: "#4FA79A",
    sphereShade: "rgba(10,60,55,.4)",
    ...look("#4FA79A", "#B79BE0", "#F2D4DA", ["#E2F2EF", "#C2E2DC"]),
  },
  {
    slug: "married-life",
    title: "Better Married Life",
    blurb: "Patience, warmth and fewer arguments at home.",
    price: PRICE,
    sphere: "#F2A7A0",
    sphereShade: "rgba(120,20,40,.35)",
    ...look("#F2A7A0", "#FFFFFF", "#8E1F3A", ["#FBE9EA", "#F2C9CC"]),
  },
  {
    slug: "studies",
    title: "Studies",
    blurb: "Focus, memory and calm before exams.",
    price: PRICE,
    sphere: "#7A3FC0",
    sphereShade: "rgba(40,10,70,.45)",
    ...look("#7A3FC0", "#6BBFA3", "#EDEFF5", ["#EEE6F8", "#D6C6EE"]),
  },
  {
    slug: "delay-in-marriage",
    title: "Delay in Marriage",
    blurb: "For when the right match keeps getting delayed.",
    price: PRICE,
    sphere: "#B8325A",
    sphereShade: "rgba(90,10,35,.42)",
    ...look("#B8325A", "#F7D7DA", "#E3C67C", ["#F9E3EA", "#EFC0CF"]),
  },
  {
    slug: "weight-loss",
    title: "Weight Loss",
    blurb: "Motivation and discipline for your fitness journey.",
    price: PRICE,
    sphere: "#E07A2E",
    sphereShade: "rgba(110,45,10,.4)",
    ...look("#E07A2E", "#5AA9C8", "#F3D9B8", ["#FBEBDD", "#F2CFAE"]),
  },
];

/** Bead colours cycling around the hero bracelet */
export const HERO_BEADS = ["#050E8F", "#DCE0EE", "#7A3FC0"] as const;

export const REF_NOTE = "This is a reference image, your bracelet will be customized according to you.";


export const MULANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const GIFTS = [
  {
    slug: "rakhi",
    title: "Rakhi for brother, sister and bhabhi",
    blurb: "Send each sibling's date of birth and every rakhi is read for them, not just for the day.",
    alt: "Illustration of a red, gold and blush crystal rakhi bracelet",
    photoAlt: "Red crystal bead bracelet with gold and orange accent beads",
    gradient: "linear-gradient(170deg,#F7D7DA,#DCE0EE)",
    beads: ["#8E1F3A", "#E7B32A", "#F2A7A0"],
  },
  {
    slug: "for-your-mother",
    title: "For your mother",
    blurb: "Chosen for her numbers: calm, health and protection for the woman who looks after everyone.",
    alt: "Illustration of a rose quartz, amethyst and moonstone bracelet",
    photoAlt: "Amethyst and clear crystal bead bracelet",
    gradient: "linear-gradient(170deg,#E6DAF6,#DCE0EE)",
    beads: ["#D96B86", "#7A3FC0", "#EDEFF5"],
  },
  {
    slug: "anniversary",
    title: "For an anniversary",
    blurb: "A pair read from both your birth dates, so the crystals support the two of you together.",
    alt: "Illustration of a matching pair of rose and gold crystal bracelets",
    photoAlt: "Fine gemstone bead bracelets resting together in a shell",
    gradient: "linear-gradient(170deg,#F4ECC8,#DCE0EE)",
    beads: ["#F2A7A0", "#E7B32A", "#050E8F"],
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
const MORE_REVIEWS = "https://www.instagram.com/stories/highlights/18046452023799577/";

// Real customer messages, published by Bracelet By Ammit in the "Reviews" and
// "More Reviews" highlights on Instagram (Ammit asked us to use them, 25 Oct 2026).
// First names are shown only where they already appear publicly in the highlight.
// Lightly edited for spelling; "…" marks a shortened message. Reviews describing
// health outcomes were left out on purpose (advertising rules on health claims).
const IG = (href: string) => ({ label: "Shared on Instagram", href });

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I wore the bracelet in August 2025 and now I have finally received a job offer in a prestigious position in Germany. After wearing it I felt very positive and confident, and my job interviews were successful. I want to thank you from my heart.",
    name: "Sagnik",
    intention: "career-and-money",
    source: IG(MORE_REVIEWS),
  },
  {
    quote:
      "I am wearing the spiritual bracelet you made for me as per the mentioned day and time, and I truly feel thankful for your work. I received great news today and I'm feeling very grateful. Your dedication and positive energy really reflect in your work.",
    name: "Vishakha",
    source: IG(MORE_REVIEWS),
  },
  {
    quote:
      "This is my 2nd purchase. My first was the love bracelet. I can't even explain it, it was magic: when I started wearing it, everything changed in our relationship. Now this one is for my career. Loads of love, Ammit sir and team.",
    name: "Customer on WhatsApp",
    intention: "love-and-relationships",
    source: IG(MORE_REVIEWS),
  },
  {
    quote:
      "Maine aapse 3rd time bracelet purchase kiya hai. 2021 mein liya tha, phir 2023 mein, aur ab 2026 mein career aur financial ke liye. Aur sach mein yeh bahut achha kaam karta hai. Thank you so much, Ammit sir.",
    name: "Vijaya",
    intention: "career-and-money",
    source: IG(MORE_REVIEWS),
  },
  {
    quote:
      "Thank you sir for the bracelet which you have made especially for me. It is making things easier for me. People and situations are changing for me, and I'm feeling more positive than ever. Thank you so much.",
    name: "Customer on WhatsApp",
    source: IG(REVIEWS_HIGHLIGHT),
  },
  {
    quote: "The bracelet designed by Ammit ji is working for me. Wanted to thank you guys, and specifically Ammit ji.",
    name: "Alpana",
    source: IG(MORE_REVIEWS),
  },
  {
    quote:
      "Thank you so much for the beautiful bracelet, just received. Bracelet ko open karte hi bahut positive vibes feel hui. Thank you so much.",
    name: "Deepika",
    source: IG(MORE_REVIEWS),
  },
  {
    quote:
      "Aap jo bracelet banate ho, woh bahut achhe hain. Mujh par bracelet ka bahut hi achha asar ho raha hai. Main family ke liye aur bracelet lene wali hoon. Thank you so much.",
    name: "Kavita",
    source: IG(REVIEWS_HIGHLIGHT),
  },
  {
    quote:
      "Aapse bracelet liya hai, 1 month hone ko aaya hai. Positive ho rahi hoon, thoughts ki clarity ho rahi hai, study mein mann lag raha hai. I'm so grateful.",
    name: "Customer on WhatsApp",
    source: IG(REVIEWS_HIGHLIGHT),
  },
  {
    quote: "I received the bracelet today. It's very beautiful and gives positive vibes. Thank you sir.",
    name: "Ambika",
    source: IG(MORE_REVIEWS),
  },
  {
    quote:
      "Sir, maine 2 baar bracelet banwaye hain aur mujhe isse bahut zyada achha effect mehsoos hua hai. It really works. Thank you so much.",
    name: "Customer on WhatsApp",
    source: IG(MORE_REVIEWS),
  },
  {
    quote: "Aapka bracelet sahi mein bahut kaam karta hai. Thank you!",
    name: "Somya",
    source: IG(MORE_REVIEWS),
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
  legalName: "Bracelet By Ammit",
  founder: "Ammit Kukreja, Numerologist",
  address: "GuruAtman, Gauripada, Kalyan West, Thane, Maharashtra 421301",
  email: "",
  phone: "+91 78888 35454",
  gstin: "", // not GST-registered (confirmed by Ammit, 25 Oct 2026)
  grievanceOfficer: { name: "Ammit Kukreja", designation: "Founder" },
};

/** Studio credit in the footer bar. */
export const CREDIT = { label: "Sitelytc", href: "https://www.sitelytc.com/" } as const;
