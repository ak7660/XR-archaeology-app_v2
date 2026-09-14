/** Wording and dates for event bookings, kept out of the screens. */
import { TranslationKey } from "@/locales";
import { fill } from "./auth_errors";
import { eventMoment } from "./event_dates";

type Translate = (key: TranslationKey) => string;

export function peopleLabel(people: number, t: Translate) {
  return people === 1 ? t("booking.peopleOne") : fill(t("booking.peopleMany"), { count: people });
}

export function placesLeftLabel(left: number, t: Translate) {
  if (left <= 0) return t("booking.full");
  return left === 1 ? t("booking.onePlaceLeft") : fill(t("booking.placesLeft"), { count: left });
}

/** "Sun, 20 Sep 2026", or "20 Sep - 25 Sep 2026" for a multi-day event (Armenia days). */
export function eventWhenLabel(event: { startDate?: any; endDate?: any }) {
  const start = eventMoment(event.startDate);
  const end = eventMoment(event.endDate);
  if (!start) return "";
  if (!end || end.isSame(start, "day")) return start.format("ddd, D MMM YYYY");
  return `${start.format("D MMM")} - ${end.format("D MMM YYYY")}`;
}
