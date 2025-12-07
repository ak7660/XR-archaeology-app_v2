import { Content } from "@/models";
import { useAppTheme } from "@/providers/style_provider";
import { ImageStyle, View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { Tts } from "@/components/common/tts";
import { useLocalizedText } from "@/hooks/useLocalizedText";
import Carousel from "./carousel";

export interface Props {
  content: Content;
  hideIndicators?: boolean;
  imageRatio?: number;
  animating?: boolean;
  duration?: number;
  useTts?: boolean;
  imageStyle?: ViewStyle & ImageStyle;
}

export default function ContentItem({ content, useTts = false, ...props }: Props) {
  const { theme } = useAppTheme();
  const getLocalizedText = useLocalizedText();

  const heading = getLocalizedText(content.heading) ?? "";
  const desc = getLocalizedText(content.desc) ?? "";

  return (
    <View>
      <Text variant="titleMedium" style={{ marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        {heading}
      </Text>
      {content.images && <Carousel images={content.images} imageStyle={props.imageStyle} />}
      {useTts ? (
        <Tts
          variant="bodyMedium"
          text={desc}
          style={{ color: theme.colors.text, marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}
        ></Tts>
      ) : (
        <Text variant="bodyMedium" style={{ color: theme.colors.text, marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
          {desc}
        </Text>
      )}
    </View>
  );
}
