import { AppBar, Carousel, ContentItem, ErrorPage, LoadingPage, MainBody, NAVBAR_HEIGHT } from "@/components";
import { CompassIcon, FootStepsIcon, LocationIcon, MountainIcon, TimeOutlineIcon } from "@/components/icons";
import MapPreview from "@/components/map/map_preview";
import { Location, Route, ArReconstruction, Storyboard } from "@/models";
import { distanceFromLatLonInKm } from "@/plugins/geolocation";
import { getThumb } from "@/plugins/utils";
import { Paginated, useFeathers } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, ImageBackground, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Button, Chip, Text } from "react-native-paper";
import * as ExpoLocation from "expo-location";
import { Routes } from "@/app/composable/routes";
import { Tts } from "@/components/common/tts";

export default function Page() {
  const feathers = useFeathers();
  const { theme } = useAppTheme();
  const { getLocalizedText } = useLanguage();
  const { width: screenWidth } = useWindowDimensions();
  const style = useStyle({ theme, screenWidth });
  /**
   * @property {string} id refers to the _id of model
   */
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loaded, setLoaded] = useState(false);
  const [route, setRoute] = useState<Route>();
  const [points, setPoints] = useState<Location[]>([]);
  const total = useRef(1); // used to fetch all related points in route

  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [arReconstructions, setArReconstructions] = useState<ArReconstruction[]>([]);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);

  /** This is from google map */
  const avgKmPerHour = 4.5;

  useEffect(() => {
    async function init() {
      try {
        if (!id) return;
        const res = await feathers.service("routes").get(id);
        const locations: Location[] = [];
        while (total.current > locations.length) {
          const results: Paginated<Location> = await feathers.service("locations").find({
            query: { route: id, $sort: "order", $skip: locations.length },
          });

          total.current = results.total;
          if (results.total === 0 || results.data.length === 0) break;

          locations.push(...results.data);
        }
        var sum = 0;
        if (locations.length > 1) {
          for (let i = 1; i < locations.length; i++) {
            const prev = locations[i - 1];
            const cur = locations[i];
            sum += distanceFromLatLonInKm(prev, cur);
          }
        }
        // round up to nearest 0.05
        const distance = Math.ceil(sum * 20) / 20;
        var text = "";
        if (distance < 1) {
          text = `${distance * 1000} m`;
        } else {
          text = `${distance} km`;
        }
        setDistance(text);
        const duration = Number((sum / avgKmPerHour).toFixed(2));
        if (duration < 1) {
          text = `~${Math.round(duration * 60)} minutes`;
        } else if (duration > 1) {
          text = `${duration} hours`;
        } else {
          text = "1 hour";
        }
        setDuration(text);
        setPoints(locations);
        setRoute(res);

        // Fetch AR reconstructions and storyboards for this route
        try {
          console.log("[Route Page] Fetching AR data for route id:", id);
          const [arRes, sbRes] = await Promise.all([
            feathers.service("arReconstructions").find({ query: { route: id, $sort: { order: 1 } } }).catch((err) => {
              console.warn("[Route Page] arReconstructions fetch error:", err?.message || err);
              return { data: [] };
            }),
            feathers.service("storyboards").find({ query: { route: id, $sort: { order: 1 } } }).catch((err) => {
              console.warn("[Route Page] storyboards fetch error:", err?.message || err);
              return { data: [] };
            }),
          ]);
          console.log("[Route Page] AR reconstructions fetched:", arRes.data?.length ?? 0, arRes.data);
          console.log("[Route Page] Storyboards fetched:", sbRes.data?.length ?? 0, sbRes.data);
          setArReconstructions(arRes.data ?? []);
          setStoryboards(sbRes.data ?? []);
        } catch (e) {
          console.warn("[Route Page] Failed to fetch AR data for route:", e);
        }
      } catch (error) {
        console.warn(error);
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, []);

  async function startARTour(index?: number) {
    index ??= 0;
    const ids = points.map(({ _id }) => _id);
    const goTo = () => router.push({ pathname: Routes.ArExplore, params: { service: "locations", targetId: index, idString: JSON.stringify(ids), routeId: id } });
    try {
      const { coords: position } = await ExpoLocation.getCurrentPositionAsync();
      if (distanceFromLatLonInKm(position, points[index]) > 5) {
        Alert.alert("> 5km Distance Alert", "You're too far from the destination.\nDo you still want to proceed with the AR tour?", [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: goTo },
        ]);
      } else {
        goTo();
      }
    } catch (err) {
      Alert.alert("Get Current Location Error", err.message, [ { text: "Ok", style: "cancel" }, ])
    }
  }

  function renderTopSection() {
    if (!route) return <></>;
    const image = route?.thumbnails?.[0];
    const content = (
      <>
        <View style={{ top: theme.spacing.lg, right: theme.spacing.lg, left: theme.spacing.lg, position: "absolute" }}>
          <Text variant="headlineMedium" style={{ color: theme.colors.white, textShadowOffset: { width: 0, height: 2 }, textShadowColor: "black" }}>
            {getLocalizedText(route.name)}
          </Text>
        </View>
        <View style={{ bottom: theme.spacing.xs, left: theme.spacing.lg, right: theme.spacing.xl, position: "absolute" }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: theme.spacing.xs, columnGap: theme.spacing.xl }}>
            <View style={style.labelRow}>
              <TimeOutlineIcon size={24} fill="white" />
              <Text variant="bodyMedium" style={{ color: "white" }}>
                {duration}
              </Text>
            </View>
            <View style={style.labelRow}>
              <MountainIcon size={24} fill="white" />
              <Text variant="bodyMedium" style={{ color: "white" }}>
                {distance}
              </Text>
            </View>
            <View style={style.labelRow}>
              <FootStepsIcon size={24} fill="white" />
              <Text variant="bodyMedium" style={{ color: "white" }}>
                {route.difficulty}
              </Text>
            </View>
          </View>
        </View>
      </>
    );

    return image ? (
      <ImageBackground source={{ uri: getThumb(image) }} style={style.thumbnail} imageStyle={style.image}>
        {content}
      </ImageBackground>
    ) : (
      <View style={[style.thumbnail, { backgroundColor: theme.colors.grey3 }]}>{content}</View>
    );
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar showBack />
      {!loaded ? (
        <LoadingPage />
      ) : route ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.md }}>
          {renderTopSection()}
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.text, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xl }}
          >
            {getLocalizedText(route.desc)}
          </Text>

          {points && points.length ? (
            <View style={{ flexDirection: "column" }}>
              <Text variant="titleMedium" style={{ color: theme.colors.text, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xs }}>
                Explore the area
              </Text>
              <MapPreview points={points} style={style.map} />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.xs,
                }}
              >
                <Button
                  mode="contained"
                  onPress={() =>
                    router.push({
                      pathname: Routes.RouteMap,
                      params: { latitude: points[0].latitude, longitude: points[0].longitude, routeId: route._id },
                    })
                  }
                  textColor={theme.colors.textOnPrimary}
                  style={style.button}
                  labelStyle={style.buttonLabelStyle}
                  // icon={() => <LocationIcon fill={theme.colors.textOnPrimary} size={20} />}
                >
                  <Text variant="labelMedium" style={{ color: theme.colors.textOnPrimary, textAlignVertical: "center" }}>
                    View in a map
                  </Text>
                </Button>
                <Button
                  mode="outlined"
                  style={[style.button, { borderWidth: 2, borderColor: theme.colors.primary }]}
                  labelStyle={style.buttonLabelStyle}
                  // icon={() => <CompassIcon fill={theme.colors.primary} size={20} />}
                  onPress={() => startARTour()}
                >
                  <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                    Start AR tour
                  </Text>
                </Button>
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: "column", rowGap: theme.spacing.xl, marginTop: theme.spacing.xl * 1.5 }}>
            {points
              ? points.map((point, index) => (
                  <View key={point._id} style={{ flexDirection: "column", rowGap: theme.spacing.md }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        columnGap: theme.spacing.xs,
                        paddingHorizontal: theme.spacing.lg,
                      }}
                    >
                      <Text variant="titleMedium" style={{ color: theme.colors.text, flexGrow: 1, flexShrink: 1 }}>
                        {index + 1}. {getLocalizedText(point.name)}
                      </Text>
                      <Button
                        mode="contained"
                        textColor={theme.colors.textOnPrimary}
                        style={style.button}
                        labelStyle={style.buttonLabelStyle}
                        onPress={() => startARTour(index)}
                      >
                        <Text
                          variant="labelMedium"
                          style={{ color: theme.colors.textOnPrimary, textAlignVertical: "center", flexShrink: 1, flexGrow: 0 }}
                        >
                          Start AR tour
                        </Text>
                      </Button>
                    </View>

                    {point.images && <Carousel images={point.images} />}
                    {point.desc && <Tts
                      text={getLocalizedText(point.desc)}
                      variant="bodyMedium"
                      style={{
                        color: theme.colors.text,
                        paddingHorizontal: theme.spacing.lg,
                      }}
                    >
                    </Tts>}
                  </View>
                ))
              : null}
          </View>

          {/* AR Points of Interest */}
          {(arReconstructions.length > 0 || storyboards.length > 0) && (
            <View style={{ flexDirection: "column", marginTop: theme.spacing.xl * 1.5, paddingHorizontal: theme.spacing.lg }}>
              <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: theme.spacing.md }}>
                AR Points of Interest
              </Text>

              {arReconstructions.map((ar) => {
                const thumbUri = ar.images?.[0] ? getThumb(ar.images[0]) : null;
                return (
                  <View key={ar._id} style={style.arCard}>
                    {thumbUri && (
                      <Image source={{ uri: thumbUri }} style={style.arCardImage} />
                    )}
                    <View style={{ flex: 1, paddingVertical: theme.spacing.xs }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, marginBottom: 2 }}>
                        <Chip compact textStyle={{ fontSize: 10 }} style={{ backgroundColor: theme.colors.primary + "22" }}>AR Wall</Chip>
                      </View>
                      <Text variant="titleSmall" style={{ color: theme.colors.text }} numberOfLines={2}>
                        {ar.name}
                      </Text>
                      {ar.briefDesc ? (
                        <Text variant="bodySmall" style={{ color: theme.colors.grey1, marginTop: 2 }} numberOfLines={2}>
                          {ar.briefDesc}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {storyboards.map((sb) => {
                const thumbUri = sb.images?.[0] ? getThumb(sb.images[0]) : null;
                return (
                  <View key={sb._id} style={style.arCard}>
                    {thumbUri && (
                      <Image source={{ uri: thumbUri }} style={style.arCardImage} />
                    )}
                    <View style={{ flex: 1, paddingVertical: theme.spacing.xs }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, marginBottom: 2 }}>
                        <Chip compact textStyle={{ fontSize: 10 }} style={{ backgroundColor: "#4CAF5022" }}>Storyboard</Chip>
                      </View>
                      <Text variant="titleSmall" style={{ color: theme.colors.text }} numberOfLines={2}>
                        {sb.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.grey1, marginTop: 2 }}>
                        {sb.pages?.length ?? 0} {(sb.pages?.length ?? 0) === 1 ? "page" : "pages"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        <ErrorPage message="Details for this item aren't available" />
      )}
    </MainBody>
  );
}

const useStyle = ({ theme, screenWidth }: { theme: AppTheme; screenWidth: number }) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignContent: "center" },
    image: { resizeMode: "cover" },
    thumbnail: {
      width: screenWidth,
      height: Math.round((screenWidth * 9) / 16),
      position: "relative",
    },
    labelRow: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      alignItems: "center",
    },
    map: {
      width: screenWidth,
      height: Math.round((screenWidth * 9) / 32),
    },
    button: {
      borderRadius: theme.borderRadius.xs,
      flexDirection: "row",
      alignContent: "center",
      padding: 0,
    },
    buttonLabelStyle: {
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
    },
    arCard: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: theme.spacing.md,
      backgroundColor: theme.colors.surface ?? "#fff",
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.sm,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    arCardImage: {
      width: 72,
      height: 72,
      borderRadius: theme.borderRadius.xs,
      resizeMode: "cover",
    },
  });
