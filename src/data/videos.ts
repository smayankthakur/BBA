// Ammit's YouTube Shorts mapped to pages. Only videos whose thumbnails show
// Ammit alone are used (celebrity/public-figure reels are deliberately left
// out). Ammit should confirm each one before public launch.

export type Video = { id: string; title: string };

export const BRACELET_VIDEOS: Record<string, Video> = {
  "married-life": { id: "VSYo63ReE6U", title: "Better married life bracelet" },
  "buri-nazar": { id: "rtr6Afi4tTk", title: "Buri nazar and evil eye bracelet" },
  "studies": { id: "7e-IxrQ65Mw", title: "Better studies bracelet" },
  "health": { id: "RglftpSW5sQ", title: "Bracelet for better health and mental healing" },
};

export const MULANK_VIDEOS: Record<number, Video> = {
  1: { id: "5O7mGmDKn_M", title: "Mulank 1, 2 and 3 in 2026" },
  2: { id: "P_sfaKT5jnc", title: "Born on 2, 11, 20 or 29: number 2" },
  3: { id: "cJ96nbbIVsQ", title: "Born on 3, 12, 21 or 30: number 3" },
  4: { id: "Sk1JgTM4ajk", title: "Myth: number 4 is unlucky" },
  5: { id: "ZLjITOqVlJg", title: "Mulank 4, 5 and 6 in 2026" },
  6: { id: "qwXP-_LB31w", title: "Myth: number 6 is materialistic" },
  7: { id: "usQRUS5Y6Co", title: "Born on 7, 16 or 25: number 7" },
  8: { id: "hFCGygBRXY4", title: "3 myths about number 8" },
  9: { id: "HMtP14b0_6M", title: "Mulank 7, 8 and 9 in 2026" },
};

export const COMBO_VIDEOS: Record<string, Video> = {
  "4-9-2": { id: "WnPISnaA_ds", title: "4-9-2 in your date of birth" },
  "3-5-7": { id: "Bx8nHgrGHRU", title: "3-5-7 in your birth chart" },
  "8-1-6": { id: "EH5gB4y_z-Q", title: "The power of 8-1-6" },
  "4-3-8": { id: "Z3vInWWVgIw", title: "4-3-8 in your birth chart" },
  "9-5-1": { id: "hjhBRIezv7U", title: "9-5-1: a powerful combination" },
  "2-7-6": { id: "DnUbCVNDgic", title: "The magic of 2-7-6" },
};

export const CARE_VIDEO: Video = { id: "NLb5BcYFoMo", title: "What to do when your crystal bracelet breaks" };
export const ABOUT_VIDEO: Video = { id: "CySF-l3yeBQ", title: "Right crystal, right direction" };
