import { Model } from "./utils";
import { MultilingualText } from "./attraction";

export class File {
  object!: string;
  material?: string;
  texture?: string;
}

export class Artifact extends Model {
  name!: string | MultilingualText;
  image?: string;
  desc?: string | MultilingualText;
  location?: string;
  date?: string;
  tags?: string;
  createdAt: Date = new Date();
  file?: File;

  latitude?: number;
  longitude?: number;

  width?: number;
  height?: number;
  length?: number;
}
