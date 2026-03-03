import { useEffect, useState } from "react";
import { StyleSheet, View, Button, Text, ToastAndroid } from "react-native";
import {
  ViroARScene,
  ViroAmbientLight,
  ViroARSceneNavigator,
  ViroText,
  Viro3DObject,
  ViroCameraTransform,
  ViroNode,
} from "@viro-community/react-viro";
import { AppTheme, useAppTheme } from "@providers/style_provider";
import { IconBtn, MainBody } from "@/components";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeftIcon } from "@/components/icons";
import { router, useLocalSearchParams } from "expo-router";
import { captureScreen } from "react-native-view-shot";
import { DirectButtons, Direction } from "@/components/arcontrol/native-buttons";
import { RotationButtons, RotationDirection } from "@/components/arcontrol/rotation-buttons";
import * as ScreenOrientation from "expo-screen-orientation";
import * as MediaLibrary from "expo-media-library";
import Slider from "@react-native-community/slider";
import { useArModelStore } from "@/app/state/position";
import { useAppStore } from "@/app/state/app";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { ARInfo, WALL_INFOS, resolveModelSource } from "./fixed-things/ar";
import { Image } from "react-native";
import { useFeathers } from "@/providers/feathers_provider";

const GuideScene = observer(() => {
  const [lastforward, setForward] = useState([0, 0, 0]);
  const ModelStore = useArModelStore();
  const feathers = useFeathers();
  const params = useLocalSearchParams<{ id?: string }>();

  // Try hardcoded first; if not found, fetch from backend
  const hardcodedWall = WALL_INFOS.find((wall) => wall.id === Number(params.id)) as ARInfo | undefined;
  const [remoteWall, setRemoteWall] = useState<any>(null);
  const [wallLoading, setWallLoading] = useState(!hardcodedWall);

  useEffect(() => {
    if (hardcodedWall) return; // already have it
    async function fetchWall() {
      try {
        const res = await feathers.service("arReconstructions").get(params.id!);
        setRemoteWall(res);
      } catch (err) {
        console.warn("Failed to fetch AR reconstruction from backend:", err);
      } finally {
        setWallLoading(false);
      }
    }
    if (params.id) fetchWall();
    else setWallLoading(false);
  }, [params.id]);

  const wall = hardcodedWall ?? remoteWall;
  const modelSource = wall ? resolveModelSource(wall.model) : undefined;

  // This useEffect must be before any early returns to preserve hook order
  useEffect(() => {
    if (ModelStore.stage !== "unlock") {
      const [x, y, z] = lastforward;
      ModelStore.setModelPosition([x * ModelStore.distance + 20, y * ModelStore.distance - 20, z * ModelStore.distance]);
    }
  }, [ModelStore.radio]);

  // Safety check - if wall not found or still loading, return empty scene
  if (wallLoading) {
    return (
      <ViroARScene>
        <ViroAmbientLight color="#ffffff" intensity={600} />
      </ViroARScene>
    );
  }
  if (!wall || !modelSource) {
    console.error("Wall not found or model missing for id:", params.id);
    return (
      <ViroARScene>
        <ViroAmbientLight color="#ffffff" intensity={600} />
      </ViroARScene>
    );
  }

  const updateCameraPosition = (cameraTransform: ViroCameraTransform) => {
    if (ModelStore.stage !== "unlock") {
      return;
    }
    const { forward } = cameraTransform;
    const [x, y, z] = forward;
    setForward(forward);
    ModelStore.setModelPosition([x * ModelStore.distance + 20, y * ModelStore.distance - 20, z * ModelStore.distance]);
  };

  return (
    <>
      <ViroARScene onCameraTransformUpdate={(info) => updateCameraPosition(info)}>
        <ViroAmbientLight color="#ffffff" intensity={600} />
        {ModelStore.stage === "unlock" && (
          <ViroNode position={[0, 0, -1]}>
            <ViroText
              text="Press to place the wall"
              position={[0, 0.1, 0]}
              scale={[0.4, 0.4, 0.4]}
              style={{ fontFamily: "Arial", color: "white" }}
            />
          </ViroNode>
        )}
        <Viro3DObject
          source={modelSource}
          rotation={toJS(ModelStore.rotation)}
          position={toJS(ModelStore.position)}
          scale={[1, 1, 1]}
          type="GLB"
          onError={() => ToastAndroid.show("Model load failed, please retry!", ToastAndroid.SHORT)}
        />
      </ViroARScene>
    </>
  );
});

const ARTest = observer(() => {
  const { theme } = useAppTheme();
  const { top } = useSafeAreaInsets();
  const style = useStyle(theme);
  const appStore = useAppStore();
  const ModelStore = useArModelStore();
  const [status, requestPermission] = MediaLibrary.usePermissions();
  const [isOrientationReady, setIsOrientationReady] = useState(false);

  if (status === null) {
    requestPermission();
  }

  const changeRotation = (params: { direction: RotationDirection }) => {
    const [x, y, z] = ModelStore.rotation;
    const { direction } = params;
    const distance_unit = ModelStore.radio * 5;
    switch (direction) {
      case "down": {
        ModelStore.setModelRotation([x, y - distance_unit, z]);
        break;
      }
      case "up": {
        ModelStore.setModelRotation([x, y + distance_unit, z]);
        break;
      }
      case "right": {
        ModelStore.setModelRotation([x + distance_unit, y, z]);
        break;
      }
      case "left": {
        ModelStore.setModelRotation([x - distance_unit, y, z]);
        break;
      }
      case "rotate-z-minus": {
        ModelStore.setModelRotation([x, y, z - distance_unit]);
        break;
      }
      case "rotate-z-plus": {
        ModelStore.setModelRotation([x, y, z + distance_unit]);
        break;
      }
    }
  };

  const changePosition = (params: { direction: Direction }) => {
    const [x, y, z] = ModelStore.position;
    const { direction } = params;
    const distance_unit = ModelStore.radio * 10;
    switch (direction) {
      case "down": {
        ModelStore.setModelPosition([x, y - distance_unit, z]);
        break;
      }
      case "up": {
        ModelStore.setModelPosition([x, y + distance_unit, z]);
        break;
      }
      case "right": {
        ModelStore.setModelPosition([x + distance_unit, y, z]);
        break;
      }
      case "left": {
        ModelStore.setModelPosition([x - distance_unit, y, z]);
        break;
      }
    }
  };

  const screenShot = async () => {
    const previousState = ModelStore.stage;
    ModelStore.setStage("screenshot");
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 100);
    });
    captureScreen({
      format: "jpg",
      quality: 0.8,
      handleGLSurfaceViewOnAndroid: true,
    })
      .then(
        (uri) => {
          MediaLibrary.saveToLibraryAsync(uri)
            .then(() => {
              ToastAndroid.show("save success!", ToastAndroid.SHORT);
            })
            .catch((err) => {
              console.error(uri);
              ToastAndroid.show("save failed!", ToastAndroid.SHORT);
            });
        },
        (error) => console.error("Oops, snapshot failed", error)
      )
      .finally(() => {
        ModelStore.setStage(previousState);
      });
  };

  const changeState = () => {
    if (ModelStore.stage === "lock") {
      ModelStore.setStage("unlock");
    } else {
      ModelStore.setStage("lock");
    }
  };

  useEffect(() => {
    appStore.setAppBar("hidden");
    ModelStore.reset();
    
    // Lock orientation and wait for it to stabilize before rendering AR scene
    const initOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      // Give some time for the orientation change to complete
      setTimeout(() => {
        setIsOrientationReady(true);
      }, 300);
    };
    
    initOrientation();
    
    return () => {
      setTimeout(async () => {
        const curOrientation = await ScreenOrientation.getOrientationAsync();
        if (curOrientation !== ScreenOrientation.Orientation.PORTRAIT_UP) {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        }
        appStore.setAppBar("show");
      }, 1000);
    };
  }, []);
  // @ts-ignore

  const [hint, setHint] = useState(false);
  const showHint = () => {
    setHint(!hint);
  };

  return (
    <MainBody>
      <>
        {/* @ts-ignore */}
        {isOrientationReady && <ViroARSceneNavigator initialScene={{ scene: GuideScene }} />}
        {!isOrientationReady && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
            <Text style={{ color: 'white' }}>Initializing AR...</Text>
          </View>
        )}
        {ModelStore.stage !== "screenshot" && isOrientationReady && (
          <>
            <View style={style.hintContainer}>
              <IconBtn key={"home"} icon="help" style={{ zIndex: 10 }} iconProps={{ fill: theme.colors.primary }} onPress={() => showHint()} />
              {hint ? <Image source={require("@/assets/images/guide/hint2.jpg")} style={style.hintImage} /> : null}
            </View>
            <View
              style={[
                style.rowLayout,
                {
                  justifyContent: "space-between",
                  position: "absolute",
                  top: top + theme.spacing.xs,
                  left: 0,
                  right: 0,
                  paddingHorizontal: theme.spacing.md,
                },
              ]}
            >
              <IconBtn icon={<ChevronLeftIcon fill={theme.colors.grey1} />} onPress={() => router.back()} />
            </View>
            <View style={style.buttonsArea}>
              <View style={style.buttons}>
                <Button title={ModelStore.stage === "lock" ? "Reset" : "Place It!"} onPress={() => changeState()} />
                <Button title="Screenshot" onPress={() => screenShot()} />
              </View>
            </View>
            <View style={style.controls}>
              {ModelStore.stage === "lock" && (
                <>
                  <DirectButtons type="position" change={(params) => changePosition(params)} />
                  <RotationButtons type="rotation" change={(params) => changeRotation(params)} />
                </>
              )}
            </View>
            {/* Rotation Slider */}
            <View
              style={{
                right: 10,
                bottom: "50%",
                position: "absolute",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: theme.spacing.md,
              }}
            ></View>
            {/* Distance slider */}
            <View
              style={{
                left: 10,
                bottom: 30,
                position: "absolute",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: theme.spacing.md,
              }}
            >
              <Text style={{ color: "white" }}>{`Distance: ${ModelStore.distance.toFixed(2)} m`}</Text>
              <Slider
                style={{
                  width: 300,
                  height: 30,
                }}
                value={ModelStore.radio}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#000000"
                onValueChange={(val) => {
                  ModelStore.setRadio(val);
                }}
              />
            </View>
          </>
        )}
      </>
    </MainBody>
  );
});

export default ARTest;

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    hintContainer: {
      top: theme.spacing.sm,
      right: theme.spacing.md,
      display: "flex",
      position: "absolute",
      alignItems: "center",
    },
    hintImage: {
      width: 300,
      height: 150,
      right: 50,
      position: 'absolute',
      top: theme.spacing.lg,
    },
    rowLayout: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 0,
    },
    buttonsArea: {
      position: "absolute",
      bottom: 30,
      right: 0,
      width: "50%",
      alignSelf: "center",
    },
    controls: {
      position: "absolute",
      bottom: "50%",
      left: "-25%",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
    },
    buttons: {
      padding: 10,
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
