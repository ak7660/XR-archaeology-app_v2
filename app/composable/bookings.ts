/** Wording and dates for event bookings, kept out of the screens. */
import moment from "moment";
import { TranslationKey } from "@/locales";
import { fill } from "./auth_errors";

type Translate = (key: TranslationKey) => string;

/** A booking day (YYYY-MM-DD, an Armenia calendar day) as a moment, without any timezone shift. */
export function bookingDay(day: string) {
  return moment.utc(day, "YYYY-MM-DD", true);
}

/** "Saturday 20 September" */
export function longDay(day: string) {
  return bookingDay(day).format("dddd D MMMM");
}

export function peopleLabel(adults: number, children: number, t: Translate) {
  const a = adults === 1 ? t("booking.adultOne") : fill(t("booking.adultMany"), { count: adults });
  if (!children) return a;
  const c = children === 1 ? t("booking.childOne") : fill(t("booking.childMany"), { count: children });
  return `${a}, ${c}`;
}

export function bookButtonLabel(people: number, t: Translate) {
  return people === 1 ? t("booking.bookOne") : fill(t("booking.bookMany"), { count: people });
}

export function placesLeftLabel(left: number, t: Translate) {
  if (left <= 0) return t("booking.full");
  return left === 1 ? t("booking.onePlaceLeft") : fill(t("booking.placesLeft"), { count: left });
}

/** Today in Armenia, to split upcoming from past bookings the same way the server does. */
export function armeniaToday() {
  return moment.utc().utcOffset(240).format("YYYY-MM-DD");
}
