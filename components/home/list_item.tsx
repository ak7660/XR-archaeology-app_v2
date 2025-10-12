import { getThumb } from "@/plugins/utils";
import { useAppTheme, AppTheme } from "@/providers/style_provider";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import IconBtn from "../icon_btn";
import { Href } from "expo-router/build/link/href";
import { Tag, MultilingualText } from "@/models";
import { Routes } from "@/app/composable/routes";
import { useLocalizedText } from "@/hooks/useLocalizedText";

export interface Props {
  name: string | MultilingualText;
  briefDesc?: string | MultilingualText;
  images?: string[] | number[];
  href?: Href;
  onPress?: () => void;
  actions?: React.ReactNode[];
  showNavigate?: boolean;
  id?: string;
  latitude?: number;
  longitude?: number;
  tags?: string | (string | Tag)[];
}

export default function ListItem({ name, briefDesc, images, href, showNavigate, latitude, longitude, ...props }: Props) {
  const { theme } = useAppTheme();
  const style = useStyle({ theme });
  
  const localize = useLocalizedText();

  // Handle multilingual text
  const localizedName = typeof name === 'string' ? name : localize(name);
  const localizedBriefDesc = typeof briefDesc === 'string' ? briefDesc : localize(briefDesc);

  const onPress = useCallback(() => {
    if (href) {
      router.push(href);
    } else {
      props.onPress?.();
    }
  }, []);

  const getActions = () => {
    const actions = props.actions || [];
    if (showNavigate && latitude && longitude) {
      actions.push(
        <IconBtn
          key={"map"}
          icon="location"
          iconProps={{ fill: theme.colors.text }}
          onPress={() =>
            router.replace({
              pathname: Routes.Map,
              params: { latitude, longitude, id: props.id },
            })
          }
        />
      );
    }
    return actions;
  };

  const actions = getActions();

  function ListImage(props: {
    image: unknown
  }) {
    const { image } = props;
    if (typeof image === 'number') {
      return  <Image source={image} style={style.image} />
    }
    return <Image source={{ uri: getThumb(image) }} style={style.image} />
  }

  function render2() {
    const image: string | number | undefined = images?.[0];
    let tags = "";
    if (Array.isArray(props.tags)) {
      if (props.tags.length > 0) {
        if (typeof props.tags[0] === "string") tags = props.tags.join(", ");
        else tags = props.tags.map((tag) => (tag as Tag).name).join(", ");
      }
    } else if (typeof props.tags === "string") tags = props.tags;
    return (
      <TouchableRipple onPress={onPress}>
        <View style={{ backgroundColor: theme.colors.container, elevation: 2 }}>
          <View style={{ flexDirection: "row", alignContent: "center", justifyContent: "center", position: "relative" }}>
            {image && (
              <View style={{ width: 132, position: "absolute", top: 0, bottom: 0, left: 0 }}>
                <ListImage image={image}></ListImage>
              </View>
            )}
            <View
              style={{
                flexGrow: 1,
                flexShrink: 1,
                flexDirection: "row",
                alignContent: "center",
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                marginLeft: image ? 132 : 0,
                gap: theme.spacing.xs,
              }}
            >
              <View
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexDirection: "column",
                  justifyContent: "center",
                  alignContent: "center",
                  rowGap: theme.spacing.xs,
                  minHeight: 132,
                }}
              >
                <Text variant="labelLarge" style={{ color: theme.colors.text }}>
                  {localizedName}
                </Text>
                {localizedBriefDesc && (
                  <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                    {localizedBriefDesc}
                  </Text>
                )}
                {tags.length > 0 && (
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                    {tags}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>{actions}</View>
            </View>
          </View>
        </View>
      </TouchableRipple>
    );
  }

  return render2();
}

const useStyle = ({ theme }: { theme: AppTheme }) =>
  StyleSheet.create({
    card: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.container,
      elevation: 2,
    },
    circle: {
      borderRadius: 9999,
      overflow: "hidden",
      height: 100,
      width: 100,
    },
    image: {
      resizeMode: "cover",
      width: "100%",
      height: "100%",
    },
  });
