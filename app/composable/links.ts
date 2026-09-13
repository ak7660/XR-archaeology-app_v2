import { GeoPoint } from "@/models";

/** Public privacy policy on the website (XR-archaeology-server pages/privacy.tsx). */
export const PRIVACY_POLICY_URL = "https://www.veditourism.com/privacy";

export function getMapThirdLink(cord: GeoPoint) {
  return `https://google.com/maps/place/${cord.latitude}+${cord.longitude}`;
}