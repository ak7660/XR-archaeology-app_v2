/** Exercises the events-calendar date rules against the real helpers.
 *
 * Run:  npx tsx ./scripts/check_event_dates.ts
 *
 * There is no test runner in this project, so this is a plain script that
 * exits non-zero on failure and can be wired into CI as-is.
 */
import {
  MAX_EVENT_DAYS,
  getEventDateStrings,
  eventOverlapsRange,
  nextRange,
  toDayString,
} from "../app/composable/event_dates";

let failures = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures += 1;
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${ok ? "" : `\n         expected ${e}\n         actual   ${a}`}`);
}

const d = (s: string) => new Date(s);

console.log("\n--- calendar markers ---");
check("single-day event marks one day", getEventDateStrings(d("2026-07-01T00:00:00"), d("2026-07-01T23:09:00")), ["2026-07-01"]);
check("three-day event marks three days", getEventDateStrings(d("2025-11-15T10:00:00"), d("2025-11-17T19:00:00")), [
  "2025-11-15",
  "2025-11-16",
  "2025-11-17",
]);
check("missing end date marks only the start", getEventDateStrings(d("2026-07-12T00:00:00"), null), ["2026-07-12"]);
check("reversed range marks nothing (used to throw)", getEventDateStrings(d("2026-07-05"), d("2026-07-01")), []);
check("invalid date marks nothing", getEventDateStrings(d("not-a-date"), d("2026-07-01")), []);

// The bug the user reported: junk records spanning years dotted every date.
const twoYears = getEventDateStrings(d("2025-01-01T12:00:00"), d("2027-01-01T12:00:00"));
check("a two-year record is capped, not unbounded", twoYears.length, MAX_EVENT_DAYS);
check("  ...and would otherwise have been ~731 days", twoYears.length < 731, true);

console.log("\n--- range filtering ---");
const rs = d("2026-07-01");
const re = d("2026-07-31");
check("event inside the range is shown", eventOverlapsRange(d("2026-07-03T09:00"), d("2026-07-03T17:00"), rs, re), true);
check("event before the range is hidden", eventOverlapsRange(d("2026-06-01"), d("2026-06-02"), rs, re), false);
check("event after the range is hidden", eventOverlapsRange(d("2026-08-01"), d("2026-08-02"), rs, re), false);
check("event straddling the start is shown", eventOverlapsRange(d("2026-06-28"), d("2026-07-02"), rs, re), true);
check("event straddling the end is shown", eventOverlapsRange(d("2026-07-30"), d("2026-08-05"), rs, re), true);
check("event spanning the whole range is shown", eventOverlapsRange(d("2025-01-01"), d("2027-01-01"), rs, re), true);
check("single-day event on the range start is shown", eventOverlapsRange(d("2026-07-01T23:00"), null, rs, re), true);
check("event with no end is treated as single-day", eventOverlapsRange(d("2026-09-09"), null, rs, re), false);

console.log("\n--- range selection ---");
check("first tap sets the start", nextRange({ start: null, end: null }, "2026-07-10"), { start: "2026-07-10", end: null });
check("second tap closes the range", nextRange({ start: "2026-07-10", end: null }, "2026-07-14"), {
  start: "2026-07-10",
  end: "2026-07-14",
});
check("earlier second tap restarts from that day", nextRange({ start: "2026-07-10", end: null }, "2026-07-04"), {
  start: "2026-07-04",
  end: null,
});
check("same-day tap makes a one-day range", nextRange({ start: "2026-07-10", end: null }, "2026-07-10"), {
  start: "2026-07-10",
  end: "2026-07-10",
});
check("tapping a complete range starts a new one", nextRange({ start: "2026-07-10", end: "2026-07-14" }, "2026-07-20"), {
  start: "2026-07-20",
  end: null,
});

console.log("\n--- day strings are local, not UTC-shifted ---");
check("late-evening date keeps its own day", toDayString(new Date(2026, 6, 1, 23, 30)), "2026-07-01");
check("early-morning date keeps its own day", toDayString(new Date(2026, 6, 1, 0, 15)), "2026-07-01");

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
