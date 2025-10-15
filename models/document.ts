import { MultilingualText } from "./attraction";
import { Content, Model } from "./utils";

export class Document extends Model {
  name: MultilingualText;
  content: Content[];
  order: number;
  createdAt: Date;
}
