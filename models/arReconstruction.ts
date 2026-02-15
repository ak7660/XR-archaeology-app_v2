import { Model } from "./utils";

export class ArReconstruction extends Model {
  name!: string;
  briefDesc?: string;
  latitude!: number;
  longitude!: number;
  /** Attachment ID for the 3D .glb model */
  model?: string;
  /** Array of Attachment IDs for preview images */
  images?: string[];
  /** Whether the 3D model should be rendered reversed/flipped */
  reversed?: boolean;
  /** Route ID this reconstruction point belongs to */
  route!: string;
  /** Proximity trigger distance in meters */
  triggerDistance: number = 20;
  order: number = 0;
  createdAt: Date = new Date();
}
