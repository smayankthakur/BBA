// Pre-fills Bracelet By Ammit's Google order form from the funnel answers.
// Entry IDs and option labels must match the live form exactly; if the form
// is edited, update them here (get them from the form's "Get pre-filled link").

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSd1QN64sYmT1QPhq63vQdOUeKOSPXBAkHXjX712z2ZhX16T3A/viewform";

const ENTRY = {
  firstName: "entry.641363326",
  lastName: "entry.1851463478",
  birthDate: "entry.1521315094",
  gender: "entry.166059636",
  wristFemale: "entry.1392066854",
  wristMale: "entry.1754136413",
  purpose: "entry.1214778688",
} as const;

/** Website intention slug → the form's "Purpose" option text. */
export const PURPOSE_LABEL: Record<string, string> = {
  "married-life": "Better Married Life & Relationship",
  "buri-nazar": "Protect from Negativity & Evil Energies (Buri Nazar)",
  studies: "Better Studies",
  health: "Better Overall Health, Emotional & Mental Balance",
  "love-life": "Better Love Life & Relationship",
  "career-and-finance": "Better Career & Finance",
};

export const WRIST_OPTIONS = {
  female: ["Slim-14cm", "Medium-15cm", "Healthy-16cm"],
  male: ["Slim-16cm", "Medium-17cm", "Healthy-18cm"],
} as const;

export type Gender = "female" | "male" | "other";

export function prefilledOrderUrl(a: {
  firstName: string;
  lastName: string;
  day: number;
  month: number;
  year: number;
  gender: Gender;
  wrist?: string;
  /** Intention slug used for the form's single "Purpose" answer */
  purposeSlug?: string;
}): string {
  const p = new URLSearchParams({ usp: "pp_url" });
  if (a.firstName) p.set(ENTRY.firstName, a.firstName.trim());
  if (a.lastName) p.set(ENTRY.lastName, a.lastName.trim());
  p.set(ENTRY.birthDate, `${a.year}-${String(a.month).padStart(2, "0")}-${String(a.day).padStart(2, "0")}`);
  if (a.gender === "female") p.set(ENTRY.gender, "Female");
  if (a.gender === "male") p.set(ENTRY.gender, "Male");
  if (a.wrist) {
    if ((WRIST_OPTIONS.female as readonly string[]).includes(a.wrist)) p.set(ENTRY.wristFemale, a.wrist);
    if ((WRIST_OPTIONS.male as readonly string[]).includes(a.wrist)) p.set(ENTRY.wristMale, a.wrist);
  }
  const purpose = a.purposeSlug && PURPOSE_LABEL[a.purposeSlug];
  if (purpose) p.set(ENTRY.purpose, purpose);
  return `${FORM_URL}?${p.toString()}`;
}
