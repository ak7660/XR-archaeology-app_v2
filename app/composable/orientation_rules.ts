/** Which screens run sideways.
 *
 * Separate from orientation.ts (which talks to the native screen lock) so
 * scripts/check_nearby.ts can check the rule without React Native.
 */

/** Screens that run sideways, by path. */
export const LANDSCAPE_PATHS = ["/ar/ar_test"];

export function isLandscapePath(pathname: string): boolean {
  const path = (pathname || "").split("?")[0].replace(/\/+$/, "");
  return LANDSCAPE_PATHS.includes(path);
}
