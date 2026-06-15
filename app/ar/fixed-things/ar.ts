import { distanceFromLatLonInKm } from "@/plugins/geolocation";
import { Platform, ToastAndroid } from "react-native";
import { LatLng } from "react-native-maps";

const showDebugToast = (message: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
};
import { getThumb } from "@/plugins/utils";
import { ArReconstruction } from "@/models";
import { Storyboard } from "@/models";

// ============================================================
// Types for backend-fetched data (with LatLng point computed)
// ============================================================

/** AR Reconstruction info coming from the backend, with computed `point` */
export interface RemoteARInfo {
  _id: string;
  name: string;
  briefDesc?: string;
  latitude: number;
  longitude: number;
  point: LatLng;
  model?: string;        // Attachment ID
  images?: string[];     // Attachment IDs
  reversed?: boolean;
  route: string;
  triggerDistance?: number;
  order?: number;
}

/** Storyboard/Trench info coming from the backend, with computed `point` */
export interface RemoteTrenchInfo {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  point: LatLng;
  images?: string[];     // Attachment IDs
  pages: { text: string; imageIndex: number }[];
  route: string;
  triggerDistance?: number;
  order?: number;
}

/** Convert backend ArReconstruction records to RemoteARInfo with computed `point` */
export function toRemoteARInfos(records: ArReconstruction[]): RemoteARInfo[] {
  return records.map(r => ({
    ...r,
    point: { latitude: r.latitude, longitude: r.longitude },
  }));
}

/** Convert backend Storyboard records to RemoteTrenchInfo with computed `point` */
export function toRemoteTrenchInfos(records: Storyboard[]): RemoteTrenchInfo[] {
  return records.map(r => ({
    ...r,
    point: { latitude: r.latitude, longitude: r.longitude },
  }));
}

/** Resolve an image value to an Image source prop. Handles both local require() numbers and remote Attachment ID strings. */
export function resolveImageSource(image: string | number | undefined) {
  if (image === undefined || image === null) return undefined;
  if (typeof image === 'number') return image; // local require()
  const uri = getThumb(image);
  return uri ? { uri } : undefined;
}

/** Resolve a model value to a Viro3DObject source prop. Handles both local require() numbers and remote Attachment ID strings. */
export function resolveModelSource(model: string | number | undefined) {
  if (model === undefined || model === null) return undefined;
  if (typeof model === 'number') return model; // local require()
  // For remote models, serve the raw file (not the .jpg thumbnail)
  const uri = `${process.env.EXPO_PUBLIC_API_URL}/api/attachments/${model}`;
  return { uri };
}

// ============================================================
// Legacy hardcoded types (kept for backward compatibility)
// ============================================================

export type ARInfo = (typeof WALL_INFOS)[number];
export type TrenchInfo = (typeof TRENCH_INFOS)[number];

export const TRENCH_INFOS: {
  name: string;
  id: number;
  point: LatLng;
  image: number[];
  text: string[];
}[] = [
    {
      id: 1,
      name: "Lower Trench",
      point: {
        latitude: 39.92583774917186,
        longitude: 44.742878783616526,
      },
      image: [require('@assets/images/lower-trench1.jpg'), require('@assets/images/lower-trench1.jpg')],
      text: [
        "The lower trench explores the area between the site’s two main fortification walls. Archaeologists found a series of rough rectangular structures built near the surface sitting within the local drainage channel here. They speculate that the structures at the top might be built during the late Medieval period for capturing water or for animal pens.",
        "Below the top layer, there are at least four wash layers. The bottom layer sits directly above natural bedrock and archaeologists found pottery dating back to the Late Bronze Age-Iron Age I here.",
      ],
    },
  ];

// vedi fortress point; init point
export const WALL_INFOS: {
  point: LatLng;
  id: number;
  name: string;
  briefDesc: string;
  images: number[];
  model: number;
  [key: string]: any;
}[] = [
  {
    id: 3,
    point: {
      latitude: 39.9261389,
      longitude: 44.7382778,
    },
    reversed: true,
    name: "Vedi Fortress lower wall from the west",
    briefDesc: "Vedi Fortress lower wall from the west",
    model: require("@assets/models/wall/wall1-reverse.glb"),
    images: [require("@/assets/images/wall2.jpg")],
  },
  {
    point: {
      latitude: 39.925778,
      longitude: 44.741444,
    },
    id: 2,
    name: "Vedi Fortress: Upper wall",
    briefDesc: "Vedi Fortress: Upper wall",
    model: require("@assets/models/wall/wall2.glb"),
    images: [require("@/assets/images/wall3.jpg")],
  },
  {
    point: {
      latitude: 39.925806,
      longitude: 44.7415,
    },
    id: 1,
    name: "Vedi Fortress: Lower wall",
    briefDesc: "Vedi Fortress: Lower wall",
    model: require("@assets/models/wall/wall1.glb"),
    images: [require("@/assets/images/wall4.jpg")],
  },
  {
    id: 4,
    point: {
      latitude: 22.283519182256978,
      longitude: 114.13472046450494,
    },
    name: "Chi Wah Learning Common",
    briefDesc: "HKU Chi Wah Learning Common AR Test Point",
    model: require("@assets/models/wall/wall1.glb"),
    images: [require("@/assets/images/wall2.jpg")],
  },
  {
    id: 5,
    point: {
      latitude: 22.283694,
      longitude: 114.134131,
    },
    name: "Run Run Shaw Tower",
    briefDesc: "HKU Run Run Shaw Tower AR Test Point",
    model: require("@assets/models/wall/wall2.glb"),
    images: [require("@/assets/images/wall3.jpg")],
  },
  {
    id: 6,
    point: {
      latitude: 33.64642009950128,
      longitude: 72.9965425410109,
    },
    name: "test location",
    briefDesc: "AR Test Location",
    model: require("@assets/models/wall/wall1.glb"),
    images: [require("@/assets/images/wall2.jpg")],
  },
] as const;

export const vedi_point = {
  latitude: 39.92634215565024,
  longitude: 44.74058628178656,
};

function findTargetInrange<T extends { point: LatLng, name: string }>(data: T[], options: {
  use_hint: boolean,
  distance?: number,
}, location?: LatLng) {
  const { use_hint = false, distance: d = 20 } = options;
  if (!location) {
    return null;
  }
  for (const item of data) {
    const { point } = item;
    const distance = distanceFromLatLonInKm(location, point) * 1000;
    if (use_hint) {
      showDebugToast(`To ${item.name} has ${distance}m`)
    }
    // in 10m (default 20m), guide user to reconstruction;
    if (distance < d) {
      return item;
    }
  }
  return null;
}

export function useTrenchGuide(location?: LatLng) {
  return findTargetInrange(TRENCH_INFOS, { use_hint: true }, location);
}

export function useARReconstruction(location?: LatLng) {
  return findTargetInrange(WALL_INFOS, { use_hint: false }, location);
}

// ============================================================
// Generic proximity-check functions for backend-fetched data
// ============================================================

/** Check if user is near any RemoteARInfo. Uses per-record triggerDistance (default 20m). */
export function checkARReconstruction(data: RemoteARInfo[], location?: LatLng) {
  return findTargetInRangeWithTrigger(data, { use_hint: false }, location);
}

/** Check if user is near any RemoteTrenchInfo. Uses per-record triggerDistance (default 20m). */
export function checkTrenchGuide(data: RemoteTrenchInfo[], location?: LatLng) {
  return findTargetInRangeWithTrigger(data, { use_hint: false }, location);
}

/** Generic version that also respects per-item triggerDistance */
export function findTargetInRangeWithTrigger<T extends { point: LatLng; name: string; triggerDistance?: number }>(
  data: T[],
  options: { use_hint?: boolean },
  location?: LatLng
): T | null {
  if (!location) return null;
  for (const item of data) {
    const d = item.triggerDistance ?? 20;
    const distance = distanceFromLatLonInKm(location, item.point) * 1000;
    if (options.use_hint) {
      showDebugToast(`To ${item.name} has ${distance}m`);
    }
    if (distance < d) return item;
  }
  return null;
}