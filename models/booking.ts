/** A place booked at an event (XR-archaeology-server `eventRegistrations`). */
export interface Booking {
  _id: string;
  event: string;
  user?: string;
  /** Armenia calendar day, YYYY-MM-DD. */
  day: string;
  adults: number;
  children: number;
  name?: string;
  email?: string;
  status: "confirmed" | "cancelled" | "attended";
  createdAt?: string;
}

/** `GET /eventAvailability/:id` */
export interface EventAvailability {
  event: string;
  bookingEnabled: boolean;
  capacity: number | null;
  ended: boolean;
  /** `left` is null when the event has no limit. */
  days: { day: string; left: number | null }[];
}
