import { MultilingualText } from "./attraction";
import { Content, Model } from "./utils";

export class ExperienceItem extends Model {
  name: MultilingualText;
  briefDesc: MultilingualText;
  desc: MultilingualText;
  images: string[];
  content: Content[];
  contactText: string;
  personalLink: string;
  language: string;
  address: string;
  phone: string;
  addressLink: string;
  duration: string;
  order: number;
  businessHours: {
    openTime: string;
    closeTime: string;
    days: ("Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday")[];
  }[];
}
