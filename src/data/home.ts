// All homepage copy, links and per-item colours live here so the
// components stay presentational. Replace the [bracketed] placeholders
// with real content/prices before launch.

export const LINKS = {
  whatsapp: "https://wa.me/message/ENJCQVDZ2QU4L1",
  youtube: "https://www.youtube.com/@braceletbyammit",
  youtubeShorts: "https://www.youtube.com/@braceletbyammit/shorts",
  instagram: "https://www.instagram.com/braceletbyammit/",
  consultation: "#",
  bag: "#",
  buildBracelet: "#",
  build3in1: "#",
  shipping: "#",
} as const;

/** Show the brand intro loader on page load. */
export const SHOW_LOADER = true;

export type Intention = {
  slug: string;
  title: string;
  blurb: string;
  price: string;
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
    price: "[₹ PRICE]",
    href: "#",
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
    price: "[₹ PRICE]",
    href: "#",
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
    price: "[₹ PRICE]",
    href: "#",
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
    price: "[₹ PRICE]",
    href: "#",
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
    price: "[₹ PRICE]",
    href: "#",
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
    price: "[₹ PRICE]",
    href: "#",
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
    placeholder: "[Rakhi bracelet photo]",
    alt: "Placeholder for a Rakhi bracelet photograph",
    gradient: "linear-gradient(170deg,#F7D7DA,#DCE0EE)",
    href: "#",
  },
  {
    title: "For your mother",
    placeholder: "[Mother's Day photo]",
    alt: "Placeholder for a Mother's Day bracelet photograph",
    gradient: "linear-gradient(170deg,#E6DAF6,#DCE0EE)",
    href: "#",
  },
  {
    title: "For an anniversary",
    placeholder: "[Couple bracelet photo]",
    alt: "Placeholder for a couple's bracelet photograph",
    gradient: "linear-gradient(170deg,#F4ECC8,#DCE0EE)",
    href: "#",
  },
] as const;

export const CARE = [
  { term: "Cleansing", detail: "[How and how often to cleanse, in Ammit's words.]" },
  { term: "Recharging", detail: "[Moonlight, sunlight or salt: what suits each crystal.]" },
  { term: "Restringing", detail: "[Send the beads back and we'll restring them. Cost and timing.]" },
] as const;
