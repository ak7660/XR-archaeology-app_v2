import { Text, Button } from "react-native-paper";
import { StyleSheet, View, FlatList, Image, Alert, Pressable, Linking } from "react-native";
import { useAppTheme } from "@providers/style_provider";
import { GPSIcon, BookmarkIcon, BookmarkOutlineIcon } from "@components/icons";
import { useRouter } from "expo-router";
import { GeoPoint, Tag } from "@/models";
import { distanceFromLatLonInKm } from "@/plugins/geolocation";
import * as ExpoLocation from "expo-location";
import { Routes } from "@/app/composable/routes";
import { getMapThirdLink } from "@/app/composable/links";
import { useLocalizedText } from "@/hooks/useLocalizedText";

/**
 * @property {T[]} points is a list of locations in which the target point exits.
 * @property {string} id determines the _id of target point in points.
 * @property {function(T): string[] | string | undefined } getImage determines the function to retain images from target.
 * @property {string | undefined} titleKey determines the key to retain title from target. Default is "name"
 */
interface ItemProps<T extends GeoPoint> {
  points: T[];
  id: string;
  isSaved?: boolean;

  getImages?: (item: T) => string[] | string | undefined;
  titleKey?: string;

  modalCLose?: () => void;
}

export default function ExploreItem<T extends GeoPoint>(item: ItemProps<T>) {
  const { isSaved, modalCLose, points, id, getImages, titleKey = "name" } = item;
  if (points.length === 0) throw new Error("points in ExploreItem cannot be empty.");

  const router = useRouter();
  const { theme } = useAppTheme();
  const getLocalizedText = useLocalizedText();

  const targetIndex = points.findIndex((it) => it._id === id);
  const point = points[targetIndex];
  const title = point[titleKey];
  const displayTitle = typeof title === "string" ? title : getLocalizedText(title);
  let images = getImages?.(point);
  if (typeof images === "string") images = [images];

  let length: number | undefined;
  if (points.length > 1) {
    length = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      length += distanceFromLatLonInKm(prev, cur);
    }
    length = Math.ceil(length * 20) / 20;
  }

  const type: string | undefined = point.type;
  const tags: string | undefined = point.tags
    ?.map((tag) => {
      const tagObj = tag as Tag;
      return typeof tagObj.name === "string" ? tagObj.name : getLocalizedText(tagObj.name);
    })
    .join(", ");
  const isAttraction = !!type;

  const _style = useStyle({
    backgroundColor: theme.colors.container + "e9",
    labelGrey: theme.colors.text,
    spacing: theme.spacing,
    withImage: !!getImages && !!images && images.length,
  });

  const toDesc = () => {
    modalCLose?.();
    router.push({
      pathname: Routes.Detail,
      params: { id, service: "attractions" },
    });
  };

  const useGoogleMap = () => {
    Linking.openURL(getMapThirdLink(point))
  }

  const startARTour = async () => {
    modalCLose?.();
    const ids = points.map(({ _id }) => _id);
    const goTo = () =>
      router.push({
        pathname: Routes.ArExplore,
        params: {
          idString: JSON.stringify(ids),
          targetId: targetIndex,
          service: isAttraction ? "attractions" : "locations",
        },
      });

    try {
      const { coords: position } = await ExpoLocation.getCurrentPositionAsync();
      if (distanceFromLatLonInKm(position, point) > 5) {
        Alert.alert("> 5km Distance Alert", "You're too far from the destination.\nDo you still want to proceed with the AR tour?", [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: goTo },
        ]);
      } else {
        goTo();
      }
    } catch (err) {
      Alert.alert("Get Current Location Error", err.message, [{ text: "Ok", style: "cancel" }]);
    }
  };

  return (
    <Pressable onPress={() => toDesc()}>
      <View style={_style.item}>
        <>
          <Text variant="labelLarge" style={{ color: theme.colors.text }}>
            {displayTitle}
          </Text>
          {length && (
            <Text variant="labelMedium" style={_style.lengthText}>
              {length} km
            </Text>
          )}
          {type && (
            <View style={_style.rowLayout}>
              <Text variant="labelMedium">
                {type}
                {tags ? " | " : ""}
              </Text>
              {tags && (
                <Text variant="labelMedium" style={[{ color: theme.colors.primary }]}>
                  {tags}
                </Text>
              )}
            </View>
          )}
          {images && (
            <FlatList
              horizontal
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.sm }} />}
              data={images}
              renderItem={({ item }) => <Image style={_style.image} source={{ uri: item }} />}
            />
          )}
        </>
        <View style={{ display: "flex", flexDirection: "row", columnGap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
          <Button
            compact
            style={{ borderRadius: 999 }}
            contentStyle={_style.button}
            textColor={theme.colors.textOnPrimary}
            mode="contained"
            icon={() => <GPSIcon fill={theme.colors.textOnPrimary} style={[_style.icon, { maxHeight: 18 }]} />}
            // onPress={startARTour}
            onPress={useGoogleMap}
          >
            Start
          </Button>
          <Button
            compact
            style={[{ borderWidth: 2, borderRadius: 999, borderColor: theme.colors.primary }]}
            contentStyle={_style.button}
            mode="outlined"
            icon={() =>
              isSaved ? (
                <BookmarkIcon style={_style.icon} fill={theme.colors.primary} />
              ) : (
                <BookmarkOutlineIcon style={_style.icon} fill={theme.colors.primary} />
              )
            }
          >
            {isSaved ? "Saved" : "Save"}
          </Button>
        </View>
      </View>
    </Pressable>
  );
}

const useStyle = ({ backgroundColor, spacing, labelGrey, withImage, itemWidth }: any) =>
  StyleSheet.create({
    image: {
      height: 100,
      width: 160,
      borderRadius: 8,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    item: {
      backgroundColor: backgroundColor,
      height: withImage ? undefined : 120,
      borderRadius: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      justifyContent: "space-between",
      width: itemWidth,
    },
    button: {
      paddingHorizontal: 16,
    },
    icon: {
      marginHorizontal: -6,
    },
    lengthText: {
      color: labelGrey,
      marginTop: withImage ? 8 : -8,
    },
    rowLayout: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
