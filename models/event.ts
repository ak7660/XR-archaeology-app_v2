import { Attraction, MultilingualText } from "./attraction";
import { Model } from "./utils";

export class Event extends Model {
  name: string | MultilingualText;
  briefDesc?: string | MultilingualText;
  content?: string | MultilingualText;
  images?: string[];

  venue?: string | Attraction;
  startDate: Date;
  endDate: Date;

  order: number;
  createdAt: Date;
}
