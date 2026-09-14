/** A booking for an event (XR-archaeology-server `eventRegistrations`): one per person per event. */
export interface Booking {
  _id: string;
  event: string;
  user?: string;
  people: number;
  name?: string;
  email?: string;
  status: "confirmed" | "cancelled" | "attended";
  createdAt?: string;
}

/** `GET /eventAvailability/:id` */
export interface EventAvailability {
  event: string;
  bookingEnabled: boolean;
  ended: boolean;
  capacity: number | null;
  /** Places left; null when the event has no limit. */
  left: number | null;
}
