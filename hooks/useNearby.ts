/** "Nearest first" for a list of places.
 *
 * Location is asked for when the person turns the sorting on, not when the
 * screen opens, so the permission prompt arrives with a reason attached. The
 * position is taken once and reused while the screen is open.
 */
import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { Coordinates, sortByDistance } from "@/app/composable/nearby";

export type NearbyStatus = "off" | "locating" | "on" | "denied" | "failed";

export function useNearby() {
  const [status, setStatus] = useState<NearbyStatus>("off");
  const [position, setPosition] = useState<Coordinates | null>(null);

  const enabled = status === "on";

  const toggle = useCallback(async () => {
    if (status === "locating") return;
    if (enabled) {
      setStatus("off");
      return;
    }
    if (position) {
      setStatus("on");
      return;
    }
    setStatus("locating");
    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPosition({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      setStatus("on");
    } catch (error) {
      console.warn("nearby: could not get the current position", error);
      setStatus("failed");
    }
  }, [status, enabled, position]);

  /** The list in distance order while sorting is on, untouched otherwise. */
  const sort = useCallback(
    <T>(items: T[], coordinatesOf: (item: T) => Coordinates | undefined): T[] => (enabled ? sortByDistance(items, position, coordinatesOf) : items),
    [enabled, position],
  );

  return { status, enabled, position: enabled ? position : null, toggle, sort };
}
