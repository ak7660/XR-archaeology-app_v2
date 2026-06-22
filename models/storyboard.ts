import { Model } from "./utils";

export interface StoryboardPage {
  text: string;
  /** New format: images embedded per page */
  images?: string[];
  /** Legacy format: index into top-level Storyboard.images array */
  imageIndex?: number;
}

export interface StoryboardIntroPage {
  text?: string;
  images?: string[];
}

export class Storyboard extends Model {
  name!: string;
  latitude!: number;
  longitude!: number;
  /** Intro page — new top-level field; text is shown on the initial "approach" popup */
  introPage?: StoryboardIntroPage;
  /** Legacy top-level images array (old format) */
  images?: string[];
  /** Ordered content pages */
  pages!: StoryboardPage[];
  /** Route ID this storyboard point belongs to */
  route!: string;
  /** Proximity trigger distance in meters */
  triggerDistance: number = 20;
  order: number = 0;
  createdAt: Date = new Date();
}
