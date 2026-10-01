/**
 * Calendar days as the API knows them: "YYYY-MM-DD", in the phone's own
 * time zone (a look worn in the evening stays on that day).
 */

const pad = (value: number) => String(value).padStart(2, '0');

export function toDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a day. */
export function fromDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year!, month! - 1, date!);
}

export const today = () => toDay(new Date());

export function addDays(day: string, count: number): string {
  const date = fromDay(day);
  date.setDate(date.getDate() + count);
  return toDay(date);
}

/** Monday of the day's week (weeks start on Monday, as on the mockup). */
export function startOfWeek(day: string): string {
  const offset = (fromDay(day).getDay() + 6) % 7;
  return addDays(day, -offset);
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function endOfMonth(day: string): string {
  const date = fromDay(startOfMonth(day));
  return toDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** First day of the month `count` months later (or earlier). */
export function addMonths(day: string, count: number): string {
  const date = fromDay(startOfMonth(day));
  return toDay(new Date(date.getFullYear(), date.getMonth() + count, 1));
}

/**
 * The weeks of a month for a calendar grid: Monday to Sunday, the days of
 * the previous and next months filling the first and last weeks.
 */
export function monthGrid(day: string): string[][] {
  const first = startOfWeek(startOfMonth(day));
  const last = endOfMonth(day);
  const weeks: string[][] = [];
  for (let start = first; start <= last; start = addDays(start, 7))
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
  return weeks;
}

/** "Lundi 12 octobre 2026" (or a shorter form), capitalised. */
export function formatDay(
  day: string,
  language: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  const text = fromDay(day).toLocaleDateString(language, options);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
