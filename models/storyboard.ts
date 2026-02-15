import { Model } from "./utils";

export interface StoryboardPage {
  text: string;
  imageIndex: number;
}

export class Storyboard extends Model {
  name!: string;
  latitude!: number;
  longitude!: number;
  /** Array of Attachment IDs for storyboard images */
  images?: string[];
  /** Ordered pages of the storyboard guide */
  pages!: StoryboardPage[];
  /** Route ID this storyboard point belongs to */
  route!: string;
  /** Proximity trigger distance in meters */
  triggerDistance: number = 20;
  order: number = 0;
  createdAt: Date = new Date();
}
