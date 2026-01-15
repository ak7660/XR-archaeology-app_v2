import { distanceFromLatLonInKm } from "@/plugins/geolocation";
import { ToastAndroid } from "react-native";
import { LatLng } from "react-native-maps";

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
      latitude: 22.284631161261558,
      longitude: 114.13600909459755,
    },
    name: "Chi Wah Learning Common",
    briefDesc: "HKU Chi Wah Learning Common AR Test Point",
    model: require("@assets/models/wall/wall1.glb"),
    images: [require("@/assets/images/wall2.jpg")],
  },
  {
    id: 5,
    point: {
      latitude: 22.284563327620024,
      longitude: 114.13590364062306,
    },
    name: "Run Run Shaw Tower",
    briefDesc: "HKU Run Run Shaw Tower AR Test Point",
    model: require("@assets/models/wall/wall2.glb"),
    images: [require("@/assets/images/wall3.jpg")],
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
  if (__DEV__) {
    // local test
    return data.at(0);
  }
  if (!location) {
    return null;
  }
  for (const item of data) {
    const { point } = item;
    const distance = distanceFromLatLonInKm(location, point) * 1000;
    if (use_hint) {
      ToastAndroid.show(`To ${item.name} has ${distance}m`, ToastAndroid.SHORT)
    }
    // in 10m, guide user to reconstruction;
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