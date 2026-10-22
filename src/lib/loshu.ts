/** Lo Shu grid layout (rows top to bottom). */
export const LO_SHU = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
] as const;

/** The eight lines of the grid: 3 rows, 3 columns, 2 diagonals. */
export const LO_SHU_LINES: { combo: string; where: string }[] = [
  { combo: "4-9-2", where: "Top row" },
  { combo: "3-5-7", where: "Middle row" },
  { combo: "8-1-6", where: "Bottom row" },
  { combo: "4-3-8", where: "Left column" },
  { combo: "9-5-1", where: "Middle column" },
  { combo: "2-7-6", where: "Right column" },
  { combo: "4-5-6", where: "Diagonal" },
  { combo: "2-5-8", where: "Diagonal" },
];

/** Count how often each digit 1–9 appears in the given digits (0 is ignored). */
export function countDigits(digits: number[]): Record<number, number> {
  const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  digits.forEach((d) => {
    if (d >= 1 && d <= 9) c[d] += 1;
  });
  return c;
}
