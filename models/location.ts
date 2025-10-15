import { LatLng } from "react-native-maps";
import { MultilingualText } from "./attraction";
import { Content, Model } from "./utils";

export interface GeoPoint extends Model, LatLng {
  [key: string]: any;
}

export class Location extends Model {
  name!: MultilingualText;
  desc?: MultilingualText;
  latitude!: number;
  longitude!: number;
  images?: string[];
  order: number = 0;
  route: string;
  createdAt: Date = new Date();
}

export type DifficultyLevel = "Easy" | "Moderate" | "Difficult";
export class Route extends Model {
  name!: MultilingualText;
  briefDesc?: MultilingualText;
  desc?: MultilingualText;
  content?: Content[];
  thumbnails?: string[];
  difficulty: DifficultyLevel = "Moderate";

  order: number = 0;
  createdAt: Date = new Date();
}
