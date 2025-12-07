import { MultilingualText } from "./attraction";

export abstract class Model {
  _id: string;
}

export interface Content {
  heading: MultilingualText;
  desc?: MultilingualText;
  images?: string[];
}
