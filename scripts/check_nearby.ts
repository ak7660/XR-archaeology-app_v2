/** Checks the "nearest first" maths and the orientation rules.
 *
 *   npx tsx ./scripts/check_nearby.ts
 *
 * There is no test runner in this project, so this is a plain script that
 * exits non-zero on failure.
 */
import { calculateDistance, distanceKm, formatDistance, hasCoordinates, sortByDistance } from "../app/composable/nearby";
import { isLandscapePath } from "../app/composable/orientation_rules";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures += 1;
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${ok ? "" : `\n         expected ${e}\n         actual   ${a}`}`);
}
/** Distances are checked to the nearest tenth of a kilometre. */
function round(km: number) {
  return Math.round(km * 10) / 10;
}

// Real places. The expected distances come from two independent great-circle
// calculations (haversine and the spherical Vincenty formula), which agree to
// the metre: Vedi-Yerevan 35.414 km, Vedi-Khor Virap 13.563 km, Vedi-Ararat
// 9.078 km, Yerevan-London 3613.528 km.
const VEDI = { latitude: 39.9133, longitude: 44.7281 };
const YEREVAN = { latitude: 40.1792, longitude: 44.4991 };
const ARARAT = { latitude: 39.8333, longitude: 44.7069 };
const KHOR_VIRAP = { latitude: 39.8783, longitude: 44.5758 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

console.log("\n--- distance between two points ---");
check("Vedi to Yerevan is 35.4 km", round(calculateDistance(VEDI.latitude, VEDI.longitude, YEREVAN.latitude, YEREVAN.longitude)), 35.4);
check("Vedi to Khor Virap is 13.6 km", round(calculateDistance(VEDI.latitude, VEDI.longitude, KHOR_VIRAP.latitude, KHOR_VIRAP.longitude)), 13.6);
check("Vedi to Ararat town is 9.1 km", round(calculateDistance(VEDI.latitude, VEDI.longitude, ARARAT.latitude, ARARAT.longitude)), 9.1);
check("Yerevan to London is 3 613.5 km", round(calculateDistance(YEREVAN.latitude, YEREVAN.longitude, LONDON.latitude, LONDON.longitude)), 3613.5);
check("the same point is 0 km away", calculateDistance(VEDI.latitude, VEDI.longitude, VEDI.latitude, VEDI.longitude), 0);
check("distance is the same both ways", [
  round(calculateDistance(VEDI.latitude, VEDI.longitude, YEREVAN.latitude, YEREVAN.longitude)),
  round(calculateDistance(YEREVAN.latitude, YEREVAN.longitude, VEDI.latitude, VEDI.longitude)),
], [35.4, 35.4]);
check("crossing the date line is short, not a lap of the planet", round(calculateDistance(0, 179.9, 0, -179.9)), 22.2);

console.log("\n--- what counts as having coordinates ---");
check("a place with both is usable", hasCoordinates({ latitude: 39.9, longitude: 44.7 }), true);
check("0, 0 is a real place, not a missing one", hasCoordinates({ latitude: 0, longitude: 0 }), true);
check("one half alone is not", [hasCoordinates({ latitude: 39.9 }), hasCoordinates({ longitude: 44.7 })], [false, false]);
check("nothing, null and rubbish are not", [
  hasCoordinates(undefined),
  hasCoordinates(null),
  hasCoordinates({ latitude: NaN, longitude: 44.7 }),
], [false, false, false]);
check("no position means no distance", [distanceKm(null, VEDI), distanceKm(VEDI, {})], [undefined, undefined]);

console.log("\n--- nearest first ---");
type Place = { name: string; latitude?: number; longitude?: number };
const places: Place[] = [
  { name: "Yerevan", ...YEREVAN },
  { name: "No coordinates" },
  { name: "Khor Virap", ...KHOR_VIRAP },
  { name: "Ararat", ...ARARAT },
  { name: "Also no coordinates" },
  { name: "Vedi", ...VEDI },
];
const order = (list: Place[]) => list.map((p) => p.name);
check("sorted from where you are", order(sortByDistance(places, VEDI, (p) => p)), [
  "Vedi",
  "Ararat",
  "Khor Virap",
  "Yerevan",
  "No coordinates",
  "Also no coordinates",
]);
check("from Yerevan the order changes", order(sortByDistance(places, YEREVAN, (p) => p)), [
  "Yerevan",
  "Khor Virap",
  "Vedi",
  "Ararat",
  "No coordinates",
  "Also no coordinates",
]);
check("placeless items keep the order they came in", order(sortByDistance(places, VEDI, (p) => p)).slice(-2), ["No coordinates", "Also no coordinates"]);
check("without a position the list is left alone", order(sortByDistance(places, null, (p) => p)), order(places));
check("the original list is not reordered", order(places), ["Yerevan", "No coordinates", "Khor Virap", "Ararat", "Also no coordinates", "Vedi"]);
check("an empty list is fine", sortByDistance([], VEDI, (p: Place) => p), []);

// Two places at the same spot: the order the server sent must survive.
const tie: Place[] = [
  { name: "second", ...ARARAT },
  { name: "first", ...ARARAT },
];
check("a tie keeps the order the server sent", order(sortByDistance(tie, VEDI, (p) => p)), ["second", "first"]);

// Walks have no coordinates of their own; they are placed by where they start.
const walks = [
  { name: "River walk", start: YEREVAN },
  { name: "Fortress climb", start: VEDI },
  { name: "Unmapped walk", start: undefined as undefined | typeof VEDI },
];
check("walks sort by their starting point", sortByDistance(walks, VEDI, (w) => w.start).map((w) => w.name), [
  "Fortress climb",
  "River walk",
  "Unmapped walk",
]);

console.log("\n--- how a distance reads ---");
check("a few hundred metres", formatDistance(0.45), "450 m");
check("very close rounds to ten metres, never zero", [formatDistance(0.004), formatDistance(0.012)], ["10 m", "10 m"]);
check("just under a kilometre", formatDistance(0.999), "1000 m");
check("one decimal up to ten kilometres", [formatDistance(1), formatDistance(9.14)], ["1.0 km", "9.1 km"]);
check("whole kilometres beyond that", [formatDistance(13.4), formatDistance(35.08)], ["13 km", "35 km"]);
check("nothing to show without a distance", [formatDistance(undefined), formatDistance(NaN)], [undefined, undefined]);

console.log("\n--- which way up the app is ---");
check("the 3D reconstruction is the landscape screen", isLandscapePath("/ar/ar_test"), true);
check("query strings and trailing slashes don't fool it", [isLandscapePath("/ar/ar_test?id=1"), isLandscapePath("/ar/ar_test/")], [true, true]);
check("every other screen is portrait", [
  isLandscapePath("/home"),
  isLandscapePath("/ar/ar_explore"),
  isLandscapePath("/ar/ar_entry"),
  isLandscapePath("/account/favourites"),
  isLandscapePath("/home/event"),
  isLandscapePath(""),
], [false, false, false, false, false, false]);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
