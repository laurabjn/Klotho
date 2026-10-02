// Calendar days (YYYY-MM-DD), without time nor time zone.

const DAY_MS = 24 * 60 * 60 * 1000;

const dateOf = (day: string) => new Date(`${day}T00:00:00.000Z`);

export const dayOf = (date: Date): string => date.toISOString().slice(0, 10);

export const addDays = (day: string, days: number): string =>
  dayOf(new Date(dateOf(day).getTime() + days * DAY_MS));

/** The Sunday ending the week (Monday to Sunday) of a day. */
export function sundayOf(day: string): string {
  const weekday = dateOf(day).getUTCDay();
  return addDays(day, (7 - weekday) % 7);
}

/** Every day from `from` to `to`, both included. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}
