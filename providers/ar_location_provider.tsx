import LPF from "@/plugins/low-pass-filter";
import { Viro3DPoint } from "@viro-community/react-viro/dist/components/Types/ViroUtils";
import * as Location from "expo-location";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ToastAndroid } from "react-native";

class ARLocationContext {
  initLocation: Location.LocationObjectCoords | undefined;
  location: Location.LocationObjectCoords | undefined;
  heading: number | undefined;
  initHeading: number | undefined;
  headingAccuracy: number;
  speed: number;
  position: Viro3DPoint;
  indoor: boolean;
  cameraReady: boolean;
  setPosition: (position: Viro3DPoint) => void;
}

interface Props {
  children: React.ReactNode;
}

const ARLocationStore = createContext<ARLocationContext | null>(null);

const DISTANCE_INTERVAL = 20;
//  Theoretical the best value is 2.5. optimal value is 5. 10 is for area with tall-buildings around.
//  around 20 is for indoor
const GPS_ERROR_MARGIN = 8;
const TIME_INTERVAL = 1 * 1000;
export function ARLocationProvider({ children }: Props) {
  const [cameraReady, setCameraReady] = useState(true);
  const [indoor, setIndoor] = useState(false);

  const [initLocation, setInitLocation] = useState<Location.LocationObjectCoords>();
  const [location, setLocation] = useState<Location.LocationObjectCoords>();
  const [speed, setSpeed] = useState<number>(0.5); // meters per second
  const [heading, setHeading] = useState<number>();
  const [initHeading, setInitHeading] = useState<number>();
  const [headingAccuracy, setHeadingAccuracy] = useState<number>();

  const [position, setPosition] = useState<Viro3DPoint>([0, 0, 0]);

  const headingFilter = useRef(new LPF());
  const speedFilter = useRef(new LPF(0.75));
  const lastUpdateTimeStamp = useRef<Date>(new Date());
  /** Init environment */
  useEffect(() => {
    // On Android heading.accuracy is an enum: 0=unreliable, 1=low, 2=medium, 3=high.
    const headingAccuracyThreshold = 1;
    // Time (ms) to wait for a good heading before accepting whatever is available
    const headingTimeoutMs = 15 * 1000;

    var locationInit: boolean = false;
    var headingInit: boolean = false;
    var waited: boolean = false;
    var bestHeading: number | null = null;
    var bestHeadingAccuracy: number = -1;

    let headingListener: Location.LocationSubscription | undefined;
    let locationListener: Location.LocationSubscription | undefined;
    var timer: NodeJS.Timeout;
    var headingTimeout: NodeJS.Timeout;

    const acceptHeading = (trueHeading: number, reason: string) => {
      if (headingInit) return;
      console.log(`[AR Location] Heading accepted (${reason}):`, trueHeading);
      setInitHeading(trueHeading);
      headingInit = true;
      if (waited) {
        setCameraReady(false);
      }
    };

    const displayAlert = async () => {
      timer = setInterval(() => {
        // display a cameraReady and remind the user to face the device's camera forward,
        // if the user completed the compass calibration
        if (!headingInit) {
          waited = true;
        }
        // remind the user to stay outside
        if (!locationInit) {
          setIndoor(true);
        }
      }, 30 * 1000); // 30 seconds
    };

    const getCurrentLocation = async () => {
      const geoOpt: Location.LocationOptions = {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: TIME_INTERVAL,
        // distanceInterval: DISTANCE_INTERVAL,
      };

      // Fallback: accept whatever heading we have after timeout
      headingTimeout = setTimeout(() => {
        if (!headingInit) {
          if (bestHeading !== null) {
            acceptHeading(bestHeading, `timeout after ${headingTimeoutMs / 1000}s, accuracy=${bestHeadingAccuracy}`);
          } else {
            // No heading data at all — accept 0 as fallback so the user isn't stuck forever
            console.warn("[AR Location] No heading data received at all — using 0 as fallback");
            acceptHeading(0, "no heading data fallback");
          }
        }
      }, headingTimeoutMs);

      headingListener = await Location.watchHeadingAsync((heading) => {
        const { trueHeading } = heading;
        if (trueHeading < 0) return;
        setHeadingAccuracy(heading.accuracy);
        console.log("[AR Heading] accuracy:", heading.accuracy, "trueHeading:", trueHeading);
        // Track the best heading for timeout fallback
        bestHeading = trueHeading;
        if (heading.accuracy > bestHeadingAccuracy) {
          bestHeadingAccuracy = heading.accuracy;
        }
        if (heading.accuracy >= headingAccuracyThreshold) {
          acceptHeading(trueHeading, `accuracy=${heading.accuracy} >= threshold=${headingAccuracyThreshold}`);
        }
        if (headingInit) {
          const smoothHeading = Math.round(headingFilter.current.next(trueHeading));
          // Filter noise of true heading using low-pass-filter
          setHeading(smoothHeading);
        }
      });
      locationListener = await Location.watchPositionAsync(geoOpt, async (result: Location.LocationObject) => {
        const coords = result.coords;
        if (!locationInit) console.log("acc:", coords.accuracy);
        if (!coords.accuracy) return;
        const accuracy = Math.round(coords.accuracy);
        const now = new Date();
        if (accuracy <= GPS_ERROR_MARGIN) {
          if (!locationInit) {
            setInitLocation(coords);
            locationInit = true;
          }
          setLocation(coords);
          lastUpdateTimeStamp.current = now;

          let smoothSpeed = coords.speed || 0.5;
          // filter stationary motion
          if (smoothSpeed >= 0.5) {
            smoothSpeed = speedFilter.current.next(smoothSpeed);
            setSpeed(smoothSpeed);
            console.log(now, "update:", coords.latitude, coords.longitude, smoothSpeed);
          }
        } else if (locationInit && (now.getTime() - lastUpdateTimeStamp.current.getTime()) / 1000 > 10) {
          // if last update was 10 seconds ago, force update the location
          if (coords.accuracy < GPS_ERROR_MARGIN * 2) {
            setLocation(coords);
            lastUpdateTimeStamp.current = now;
            console.log(now, "force update:", coords.accuracy);
          }
        } else {
          setLocation(coords);
          lastUpdateTimeStamp.current = now;
          ToastAndroid.show(`LOW accuracy: ${accuracy}`, ToastAndroid.SHORT);
        }
      });
    };
    headingFilter.current.init([]);
    speedFilter.current.init([]);

    displayAlert();
    getCurrentLocation();
    return () => {
      locationListener?.remove();
      headingListener?.remove();
      timer && clearInterval(timer);
      headingTimeout && clearTimeout(headingTimeout);
    };
  }, []);

  useEffect(() => {
    if (initHeading === undefined || !location || cameraReady) return;
    // End animate after 10 sec
    var timer = setTimeout(() => {
      if (!cameraReady) {
        setCameraReady(true);
      }
    }, 5 * 1000);
    return () => timer && clearTimeout(timer);
  }, [cameraReady, initHeading, location]);

  return (
    <ARLocationStore.Provider
      value={{
        initLocation,
        initHeading,
        location,
        heading,
        headingAccuracy: headingAccuracy || 0,
        indoor,
        cameraReady,
        speed,
        position,
        setPosition,
      }}
    >
      {children}
    </ARLocationStore.Provider>
  );
}

export function useARLocation() {
  const arLocation = useContext(ARLocationStore);
  if (!arLocation) throw Error("useARLocation must be inside ARLocationProvider.");
  return arLocation;
}
