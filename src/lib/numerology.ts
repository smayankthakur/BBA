/** Reduce a number to a single digit by repeatedly summing its digits. */
export function reduce(n: number): number {
  let x = Math.abs(n);
  while (x > 9) x = String(x).split("").reduce((a, c) => a + Number(c), 0);
  return x;
}

/** Mulank (birth number): the day of the month, reduced. */
export const mulank = (day: number) => reduce(day);

/** Bhagyank (destiny number): every digit of DD-MM-YYYY, summed and reduced. */
export const bhagyank = (day: number, month: number, year: number) =>
  reduce(`${day}${month}${year}`.split("").reduce((a, c) => a + Number(c), 0));

/** Whole years between a date of birth and today. */
export function ageFrom(day: number, month: number, year: number, today = new Date()): number {
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1;
  if (m < month || (m === month && today.getDate() < day)) age -= 1;
  return age;
}

/** True when the day exists in that month/year (e.g. rejects 31 Feb). */
export function isValidDate(day: number, month: number, year: number): boolean {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}
