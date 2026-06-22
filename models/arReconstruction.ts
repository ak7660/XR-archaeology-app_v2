import { Model } from "./utils";

export class ArReconstruction extends Model {
  name!: string;
  briefDesc?: string;
  /** Populated Location object (or bare ID string before population) — source of truth for coordinates */
  location?: { latitude: number; longitude: number; [key: string]: any } | string;
  /** Direct lat/lng — absent in new schema; only present on legacy records */
  latitude?: number;
  longitude?: number;
  /** Attachment ID for the 3D .glb model */
  model?: string;
  /** Legacy: array of preview image Attachment IDs (removed in new schema) */
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
