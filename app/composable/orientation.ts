/** Which way up the app is, decided in one place.
 *
 * The 3D reconstruction (`/ar/ar_test`) is the only screen that runs in
 * landscape. Everything else is portrait.
 *
 * Previously each AR screen locked on mount and unlocked on unmount, and the
 * explore screen unlocked to `DEFAULT` - which doesn't restore portrait, it
 * lets the phone's sensor turn the whole app. Leaving the reconstruction while
 * holding the phone sideways then left the app in landscape. Now the layout
 * applies the lock for whatever screen is showing (app/_layout.tsx), so the app
 * rights itself on the way out, however the screen was left: back, a crash, or
 * returning from another app.
 */
import { useEffect } from "react";
import { AppState } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { usePathname } from "expo-router";

import { isLandscapePath } from "./orientation_rules";

type Lock = ScreenOrientation.OrientationLock;

export { isLandscapePath };

/** The lock a screen should be held in. */
export function orientationForPath(pathname: string): Lock {
  return isLandscapePath(pathname) ? ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT : ScreenOrientation.OrientationLock.PORTRAIT_UP;
}

export async function lockTo(lock: Lock): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(lock);
  } catch (error) {
    // Some devices refuse a lock (split screen, desk mode). Nothing to recover.
    console.warn("orientation lock failed", error);
  }
}

/** Keeps the app the right way up for the screen that is showing. */
export function useOrientationLock() {
  const pathname = usePathname();

  useEffect(() => {
    const apply = () => lockTo(orientationForPath(pathname));
    apply();
    // Android can forget the lock while the app is in the background.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") apply();
    });
    return () => sub.remove();
  }, [pathname]);
}
