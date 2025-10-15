import { MultilingualText } from "./attraction";

export class Tag {
  _id: string;
  name!: MultilingualText;
  createdAt: Date = new Date();
}
