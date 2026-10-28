// Content for the inner pages. Claims are phrased as traditional belief and
// Ammit's practice, never as guaranteed results. Anything marked CONFIRM needs
// the client's sign-off before public launch.

import { INTENTIONS, PRICE, type Intention } from "./home";

/* ------------------------------------------------------------------ */
/* Bracelets                                                           */
/* ------------------------------------------------------------------ */

export type BraceletDetail = {
  slug: string;
  title: string;
  /** One-line summary (also used in cards and meta descriptions) */
  blurb: string;
  /** Page intro paragraphs */
  intro: string[];
  /** "This bracelet is for you if…" */
  forWhom: string[];
  /** Crystals traditionally used for this intention (CONFIRM with Ammit) */
  crystals: string[];
  /** Optional extra note shown under the intro (e.g. medical disclaimer) */
  note?: string;
  /** Visual: sphere colour + card gradients + ring colours */
  sphere: string;
  sphereShade: string;
  sphereGloss?: number;
  cards: Intention["cards"];
  rings: Intention["rings"];
};

const MADE = "Every bracelet is newly designed for the wearer, keeping their birth chart and purpose in mind, then cleansed and energised before it's sent.";

const DETAILS: Record<string, Omit<BraceletDetail, "slug" | "title" | "blurb" | "sphere" | "sphereShade" | "sphereGloss" | "cards" | "rings">> = {
  "career-and-finance": {
    intro: [
      "For growth at work, a steadier income and sharper decisions. This bracelet is made for people who are putting in the effort and want things to move.",
      `Ammit studies your name, date of birth and the dasha of your planets, then chooses crystals traditionally linked with confidence, abundance and clear thinking. ${MADE}`,
    ],
    forWhom: [
      "You're working hard but feel stuck at the same level",
      "You're starting or growing a business",
      "You're preparing for interviews or a job change",
    ],
    crystals: ["Citrine", "Tiger eye", "Pyrite"],
  },
  "love-life": {
    intro: [
      "Whether you're hoping to meet the right person or want closeness back in a relationship you already have, this bracelet is made for love.",
      `Ammit reads your birth details before choosing the stones, so the bracelet supports what you're looking for in a way that suits you. ${MADE}`,
    ],
    forWhom: [
      "You're single and want to attract the right person",
      "You want to rebuild trust or closeness with your partner",
      "You'd like more self-love and confidence",
    ],
    crystals: ["Rose quartz", "Rhodonite", "Strawberry quartz"],
  },
  "clarity-and-confidence": {
    intro: [
      "For the times when your mind keeps going in circles, or you know what to do but can't quite bring yourself to do it. This bracelet is made for a clearer head and steadier self-belief.",
      `Ammit chooses stones traditionally linked with focus, courage and calm judgement, matched to your birth details. ${MADE}`,
    ],
    forWhom: [
      "You overthink and find it hard to decide",
      "You'd like to speak up and present yourself with confidence",
      "You're at a crossroads and want clarity on the way forward",
    ],
    crystals: ["Clear quartz", "Tiger eye", "Sodalite"],
  },
  health: {
    intro: [
      "For anyone who wants steadier energy and wellbeing, or is going through a difficult stretch and wants something calming to wear while they recover.",
      `Ammit chooses stones traditionally associated with vitality, calm and balance, matched to your birth details. ${MADE}`,
    ],
    forWhom: [
      "You want more energy and balance day to day",
      "You're recovering and want support that feels steady",
      "Stress or worry has been weighing on your health",
    ],
    crystals: ["Green aventurine", "Amethyst", "Clear quartz"],
    note: "Crystals are worn alongside medical care, never instead of it. Please keep following your doctor's advice.",
  },
  "buri-nazar": {
    intro: [
      "When things that were going well suddenly stop, many families feel it's buri nazar or negative energy around them. This bracelet is made as a protective shield for you and the people close to you.",
      `Ammit chooses grounding, protective stones that suit your birth details, so the protection sits comfortably with the rest of your chart. ${MADE}`,
    ],
    forWhom: [
      "You feel things keep going wrong without a clear reason",
      "You feel drained around certain people or places",
      "You want a protective bracelet for a child or family member",
    ],
    crystals: ["Black tourmaline", "Black obsidian", "Lapis lazuli"],
  },
  "self-healing": {
    intro: [
      "For when you've been carrying too much for too long: old hurt, constant stress, or simply feeling disconnected from yourself. This bracelet is made for calm, inner balance and letting go.",
      `Ammit chooses stones traditionally associated with peace, emotional healing and self-love, matched to your birth details. ${MADE}`,
    ],
    forWhom: [
      "You want to let go of past hurt and move forward",
      "Your mind rarely feels at rest",
      "You're starting meditation or a spiritual practice",
    ],
    crystals: ["Amethyst", "Lepidolite", "Rose quartz"],
    note: "If you're struggling with your mental health, please also speak to a doctor or counsellor. Crystals are worn alongside care, never instead of it.",
  },
  "married-life": {
    intro: [
      "Small arguments that never quite end, distance that creeps in, patience that runs out. This bracelet is made for couples who want more warmth and understanding at home.",
      `Ammit reads your birth details first, and your partner's if you share them, then chooses crystals traditionally linked with harmony, patience and affection. ${MADE}`,
    ],
    forWhom: [
      "You want fewer arguments and more patience at home",
      "You feel you and your partner have drifted apart",
      "You're newly married and want to start on a calm footing",
    ],
    crystals: ["Rose quartz", "Moonstone", "Garnet"],
  },
  studies: {
    intro: [
      "For students who sit down to study and find their mind elsewhere. This bracelet is made for focus, memory and a calmer head before exams.",
      `Parents often order it for their children. Send the student's name and date of birth and Ammit chooses the stones for their chart, not yours. ${MADE}`,
    ],
    forWhom: [
      "You find it hard to concentrate for long",
      "Exam nerves get in the way of what you know",
      "You're preparing for a competitive or government exam",
    ],
    crystals: ["Amethyst", "Green fluorite", "Clear quartz"],
  },
  "delay-in-marriage": {
    intro: [
      "When proposals keep falling through, or the right match seems to keep getting delayed, many families look for support beyond the usual efforts. This bracelet is made for that wait.",
      `Ammit studies the birth details of the person hoping to marry and chooses stones traditionally linked with attraction, harmony and timing. ${MADE}`,
    ],
    forWhom: [
      "Proposals come but don't move forward",
      "You or your family feel marriage is getting delayed",
      "You want to feel more confident and open to the right match",
    ],
    crystals: ["Rose quartz", "Moonstone", "Garnet"],
  },
  "weight-loss": {
    intro: [
      "For anyone working on their weight who wants a daily reminder to stay on track. This bracelet is made for motivation, discipline and fewer cravings getting the better of you.",
      `Ammit chooses stones traditionally associated with willpower and a balanced appetite, matched to your birth details. ${MADE}`,
    ],
    forWhom: [
      "You start a diet or routine but find it hard to keep going",
      "Cravings and stress eating get in the way",
      "You want a daily reminder of your fitness goal",
    ],
    crystals: ["Apatite", "Citrine", "Carnelian"],
    note: "A bracelet supports your intention; it doesn't replace a healthy diet, exercise or medical advice.",
  },
};

export const BRACELETS: BraceletDetail[] = INTENTIONS.map((it) => ({
  slug: it.slug,
  title: it.title,
  blurb: it.blurb,
  sphere: it.sphere,
  sphereShade: it.sphereShade,
  sphereGloss: it.sphereGloss,
  cards: it.cards,
  rings: it.rings,
  ...DETAILS[it.slug],
}));

/** Old web addresses (before the Oct 2026 purpose list) → new ones. */
export const OLD_BRACELET_SLUGS: Record<string, string> = {
  "career-and-money": "career-and-finance",
  "love-and-relationships": "love-life",
  "health-and-mental-healing": "health",
  "buri-nazar-protection": "buri-nazar",
  "better-married-life": "married-life",
  "better-studies": "studies",
};

export const braceletBySlug = (slug: string) => BRACELETS.find((b) => b.slug === slug);

/** How every bracelet is made — shared by product pages. */
export const HOW_IT_WORKS = [
  { title: "Choose your purpose", text: "Pick what you'd like your bracelet to support." },
  { title: "Share your birth details", text: "Name and full date of birth (the wearer's, if it's a gift)." },
  { title: "Ammit designs it for you", text: "He studies your birth details and purpose, then chooses every crystal." },
  { title: "Cleansed, energised, delivered", text: "You see a photo first; it's cleansed and energised, then sent free." },
] as const;

/* ------------------------------------------------------------------ */
/* Mulank 1–9                                                          */
/* ------------------------------------------------------------------ */

export type MulankDetail = {
  number: number;
  planet: string;
  planetHindi: string;
  /** Qualities traditionally associated with the number */
  traits: string[];
  summary: string;
};

export const MULANK: MulankDetail[] = [
  { number: 1, planet: "Sun", planetHindi: "Surya", summary: "Mulank 1 is ruled by the Sun: the number of leaders and self-starters.", traits: ["Leadership and independence", "Confidence and ambition", "A strong sense of self-respect"] },
  { number: 2, planet: "Moon", planetHindi: "Chandra", summary: "Mulank 2 is ruled by the Moon: the number of feeling, intuition and partnership.", traits: ["Sensitivity and intuition", "Creativity and imagination", "A gift for cooperation"] },
  { number: 3, planet: "Jupiter", planetHindi: "Guru", summary: "Mulank 3 is ruled by Jupiter: the number of wisdom, teaching and growth.", traits: ["Wisdom and a love of learning", "Optimism and generosity", "A natural guide for others"] },
  { number: 4, planet: "Rahu", planetHindi: "Rahu", summary: "Mulank 4 is ruled by Rahu: the number of hard work, originality and sudden turns.", traits: ["Hard-working and practical", "Unconventional thinking", "Life brings sudden changes"] },
  { number: 5, planet: "Mercury", planetHindi: "Budh", summary: "Mulank 5 is ruled by Mercury: the number of communication, business and quick minds.", traits: ["Quick, adaptable mind", "Strong communication and business sense", "Loves travel and variety"] },
  { number: 6, planet: "Venus", planetHindi: "Shukra", summary: "Mulank 6 is ruled by Venus: the number of love, beauty and family.", traits: ["Warmth and devotion to family", "An eye for beauty and comfort", "Charm and creativity"] },
  { number: 7, planet: "Ketu", planetHindi: "Ketu", summary: "Mulank 7 is ruled by Ketu: the number of reflection, research and the spiritual path.", traits: ["Deep thinking and research", "Spiritual and introspective", "Strong intuition"] },
  { number: 8, planet: "Saturn", planetHindi: "Shani", summary: "Mulank 8 is ruled by Saturn: the number of discipline, patience and lasting results.", traits: ["Discipline and patience", "Results that come late but last", "A strong sense of justice"] },
  { number: 9, planet: "Mars", planetHindi: "Mangal", summary: "Mulank 9 is ruled by Mars: the number of courage, energy and protection.", traits: ["Courage and energy", "Protective of the people they love", "Direct and determined"] },
];

/** Days of the month that reduce to a given mulank (1–31). */
export const birthDaysFor = (n: number) =>
  Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => {
    let x = d;
    while (x > 9) x = String(x).split("").reduce((a, c) => a + Number(c), 0);
    return x === n;
  });

/* ------------------------------------------------------------------ */
/* Gifts                                                               */
/* ------------------------------------------------------------------ */

export const GIFT_DETAILS: Record<string, { intro: string[]; send: string[]; ideas: string[] }> = {
  rakhi: {
    intro: [
      "A rakhi that's read for the person wearing it. Send each sibling's date of birth and Ammit chooses crystals for their numbers, so it's more than a thread for the day.",
      "Make one for your brother, your sister or your bhabhi, or a matching set for the whole family.",
    ],
    send: ["Each wearer's full date of birth", "Who each rakhi is for", "Anything you'd like it to support: studies, career, protection"],
    ideas: ["Protection for a brother living away from home", "Focus for a sibling preparing for exams", "Career growth for a brother or bhabhi"],
  },
  "for-your-mother": {
    intro: [
      "For the woman who looks after everyone else. Send your mother's date of birth and Ammit chooses stones for her numbers: calm, protection and balance.",
      "A thoughtful gift for Mother's Day, her birthday, or any day you want her to feel cared for.",
    ],
    send: ["Your mother's full date of birth", "What she's been going through lately, if you'd like to share", "Her wrist size, if you know it"],
    ideas: ["Calm and balance for a busy, worried mother", "Protection for the whole family through her", "Support while she recovers, alongside her doctor's care"],
  },
  anniversary: {
    intro: [
      "A pair of bracelets read from both your birth dates, so the crystals support the two of you together.",
      "For a wedding anniversary, an engagement, or simply to mark a year together.",
    ],
    send: ["Both partners' full dates of birth", "Whether you'd like a matching pair or two different bracelets", "The occasion, so we can add a note"],
    ideas: ["A matching pair for harmony at home", "Love and closeness for a couple far apart", "A first-anniversary gift with meaning"],
  },
};

/* ------------------------------------------------------------------ */
/* Consultation, care                                                  */
/* ------------------------------------------------------------------ */

export const CONSULTATION = {
  // CONFIRM: what's covered, duration, fee and format with Ammit.
  covers: [
    "Your mulank (birth number) and bhagyank (destiny number)",
    "How your numbers work together, and which ones are missing",
    "Which crystals suit you, and which to avoid",
    "Your questions on career, relationships, studies or health",
  ],
  steps: [
    "Message Ammit on WhatsApp and say you'd like a consultation",
    "Share your full date of birth and your main question",
    "Ammit confirms the time, format and fee with you",
  ],
} as const;

export const CARE_GUIDE = {
  dos: [
    "Wear it daily so it stays with you",
    "Cleanse it once a week, more often if you've had a heavy week",
    "Recharge it under the full moon every month",
    "Keep it in a soft pouch when you're not wearing it",
  ],
  donts: [
    "Don't soak it in water or wear it while bathing or swimming",
    "Keep it away from perfume, soap and cleaning chemicals",
    "Avoid letting others wear your bracelet",
    "Don't throw away beads if it breaks; keep every one",
  ],
} as const;

export const PRICE_LINE = `${PRICE}, read for your date of birth and strung by hand`;
