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

  order: number;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}
