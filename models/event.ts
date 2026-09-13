import { Attraction, MultilingualText } from "./attraction";
import { Model } from "./utils";

export class Event extends Model {
  name: MultilingualText;
  briefDesc?: MultilingualText;
  content?: MultilingualText;
  images?: string[];

  venue?: string | Attraction;
  startDate: Date;
  endDate: Date;

  /** Whether visitors can book a place in the app (missing means yes). */
  bookingEnabled?: boolean;
  /** Places per day; missing means no limit. */
  capacity?: number;

  order: number;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}
