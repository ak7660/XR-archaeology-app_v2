/** Date helpers for the events calendar.
 *
 * Kept out of the screen component so the range and marker rules can be
 * exercised directly - the marker bug (every day dotted) was a data-driven edge
 * case that is far easier to pin down here than in a rendered calendar.
 */

/** Safety valve for the day-by-day loop that builds calendar dots.
 *
 * The events collection contains records spanning a year or more; without a cap
 * a single bad record walks thousands of iterations and dots every visible day.
 */
export const MAX_EVENT_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** `YYYY-MM-DD` in local time, matching react-native-calendars' day strings. */
export function toDayString(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Every calendar day an event covers, bounded by MAX_EVENT_DAYS.
 *
 * Returns [] for unparseable dates or an end that precedes the start, so a bad
 * record contributes no markers instead of throwing (the previous
 * implementation threw "Date error" on reversed ranges).
 */
export function getEventDateStrings(start: Date, end?: Date | null): string[] {
  const dates: string[] = [];
  if (!start || isNaN(start.getTime())) return dates;

  const last = end && !isNaN(end.getTime()) ? end : start;
  if (startOfDay(last).getTime() < startOfDay(start).getTime()) return dates;

  let cursor = startOfDay(start).getTime();
  const limit = startOfDay(last).getTime();
  let guard = 0;
  while (cursor <= limit && guard < MAX_EVENT_DAYS) {
    dates.push(toDayString(new Date(cursor)));
    cursor += DAY_MS;
    guard += 1;
  }
  return dates;
}

/** Does an event overlap the selected range at all?
 *
 * Overlap rather than containment, so a multi-day event still appears when the
 * chosen range covers only part of it.
 */
export function eventOverlapsRange(
  eventStart: Date,
  eventEnd: Date | null | undefined,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  if (!eventStart || isNaN(eventStart.getTime())) return false;
  const from = startOfDay(eventStart).getTime();
  const to = endOfDay(eventEnd && !isNaN(eventEnd.getTime()) ? eventEnd : eventStart).getTime();
  return from <= endOfDay(rangeEnd).getTime() && to >= startOfDay(rangeStart).getTime();
}

/** Next range state for a tapped day.
 *
 * First tap sets the start. A second tap closes the range, unless it lands
 * before the start, in which case it becomes the new start. Tapping again once
 * a range is complete begins a fresh one.
 */
export function nextRange(
  current: { start: string | null; end: string | null },
  picked: string
): { start: string | null; end: string | null } {
  if (!current.start || (current.start && current.end)) return { start: picked, end: null };
  if (picked < current.start) return { start: picked, end: null };
  return { start: current.start, end: picked };
}
