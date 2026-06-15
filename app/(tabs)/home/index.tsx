import { Button, Text } from "react-native-paper";
import { IconBtn, MainBody, NAVBAR_HEIGHT } from "@components";
import { View, StyleSheet, ImageBackground, useWindowDimensions, Pressable, ScrollView, Image, Linking } from "react-native";
import { useState } from "react";
import { AppTheme, useAppTheme } from "@providers/style_provider";
import { useAuth } from "@providers/auth_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { Link, router } from "expo-router";
import { Orientation, isPortrait, useOrientation } from "@/plugins/orientation";
import { Routes } from "@/app/composable/routes";
import { Entries } from "@/app/composable/entries";

const DECORATE_BOX_HEIGHT = 124;

function Layout({ children, orientation }: { children?: JSX.Element | (JSX.Element | undefined | boolean)[]; orientation: Orientation }) {
  if (isPortrait(orientation)) {
    return children;
  } else {
    return <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT }}>{children}</ScrollView>;
  }
}

export default function Home() {
  const { theme } = useAppTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [topSectionHeight, setTopSectionHeight] = useState(0);
  const { t } = useTranslation();

  const style = useStyle({ theme, screenWidth, screenHeight });

  const { user } = useAuth();
  const authenticated = !!user && !!user._id;
  const orientation = useOrientation();

  const CardView = (params: { nameKey: string; link?: string; route?: any; image: number; index: number }) => {
    const { link, route, nameKey } = params;
    const Container = ({ children }) => {
      if (route) {
        return (
          <Link key={params.index} href={params.route} asChild>
            {children}
          </Link>
        );
      }
      return <>{children}</>;
    };
    const toLink = () => {
      if (link) Linking.openURL(link);
    };
    return (
      <Container key={params.index}>
        <Pressable onPress={toLink} style={style.subThumbContainer}>
          <ImageBackground source={params.image} imageStyle={style.image}>
            <View style={style.subThumb}>
              <Text variant="labelLarge" style={[style.label, params.index % 2 === 0 ? style.leftcard : style.rightcard]}>
                {t(nameKey as any)}
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
      </Container>
    );
  };

  return (
    <MainBody>
      <Layout orientation={orientation}>
        <View
          style={{
            height: topSectionHeight,
            backgroundColor: theme.colors.container,
            top: DECORATE_BOX_HEIGHT - theme.spacing.lg,
            left: 0,
            right: 0,
            position: "absolute",
            elevation: 4,
          }}
        />
        <View style={style.appBarDecorateBox} />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.xs,
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          <Text variant="titleMedium" style={{ color: theme.colors.background, paddingBottom: theme.spacing.xs }}>
            {t("home.welcomeToVedi")}
          </Text>

          <IconBtn
            icon="createAR"
            iconProps={{ fill: theme.colors.text }}
            onPress={() => {
              router.push(Routes.ArEntry);
            }}
          />
        </View>

        {/* Top Section */}
        <View
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            setTopSectionHeight(height);
          }}
          style={style.topSecion}
        >
          <Link href={Routes.History} asChild>
            <Pressable style={{ elevation: 12 }}>
              <ImageBackground source={require("@assets/images/vedi.jpg")} style={[style.thumbnail]} imageStyle={style.image}>
                <View style={{ bottom: theme.spacing.sm, left: theme.spacing.sm, position: "absolute" }}>
                  <Text variant="labelLarge" style={style.label}>
                    {t("home.explore")}
                  </Text>
                </View>
              </ImageBackground>
            </Pressable>
          </Link>
          <View style={style.entryContainer}>{Entries.map((v, index) => CardView({ ...v, index }))}</View>
        </View>
        
        {/* Plan Trip Section */}
        <View
          style={[style.loginSection, isPortrait(orientation) ? { paddingBottom: NAVBAR_HEIGHT } : {}]}
        >
          <Button
            mode="contained"
            icon={() => <Image source={require("@assets/bot.png")} style={{ width: 22, height: 22, tintColor: "white" }} />}
            onPress={() => router.push(Routes.TripPlanner)}
            style={{ borderRadius: theme.spacing.xs }}
            contentStyle={{ paddingVertical: theme.spacing.xs }}
          >
            <Text variant="labelLarge" style={{ color: theme.colors.textOnPrimary }}>
              Plan Your Trip with AI
            </Text>
          </Button>
          <View style={style.divider} />
        </View>

        {/* Map */}
        {/* <View
          style={[
            { flexGrow: 0, flexShrink: 1 },
            ...[isPortrait(orientation) ? {} : { minHeight: Math.round(MAP_IMG_HEIGHT * (screenWidth / MAP_IMG_WIDTH)) }],
          ]}
        >
          <Pressable onPress={() => router.replace({ pathname: Routes.Map, params: { latitude: vedi_point.latitude, longitude: vedi_point.longitude } })}>
            <Image source={require("@assets/images/vedi_map.jpeg")} style={{ width: "100%", height: "100%" }} />
          </Pressable>
          <View style={{ position: "absolute", top: theme.spacing.md, right: theme.spacing.sm }}>
            <Text variant="titleMedium" style={style.mapLabel}>
              Map of Valley
            </Text>
          </View>
        </View> */}
      </Layout>
    </MainBody>
  );
}

const useStyle = ({ theme, screenWidth, screenHeight }: { theme: AppTheme; screenWidth: number; screenHeight: number }) =>
  StyleSheet.create({
    appBarDecorateBox: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: theme.borderRadius.lg,
      borderBottomLeftRadius: theme.borderRadius.lg,
      position: "absolute",
      height: DECORATE_BOX_HEIGHT,
      top: 0,
      left: 0,
      right: 0,
    },
    thumbnail: {
      height: Math.round((screenWidth - theme.spacing.lg * 2) * 0.42),
      borderRadius: theme.spacing.xs,
      width: "100%",
      overflow: "hidden",
    },
    subThumbContainer: {
      borderRadius: theme.spacing.xs,
      overflow: "hidden",
      height: '30%',
      width: Math.round((screenWidth - theme.spacing.lg * 2 - theme.spacing.md) / 2 - 1),
      position: "relative",
      elevation: 8,
    },
    subThumb: {
      width: "100%",
      height: "100%",
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    label: {
      color: theme.colors.white,
      textShadowColor: theme.colors.shadow,
    },
    mapContainer: {
      overflow: "hidden",
    },
    fill: {
      width: "100%",
      height: "100%",
    },
    divider: {
      height: 1,
      width: "100%",
      backgroundColor: theme.colors.grey4,
    },
    mapLabel: {
      color: "white",
      textShadowColor: "black",
      textShadowRadius: 8,
      elevation: 8,
    },
    leftcard: {
      top: theme.spacing.xxs,
      left: theme.spacing.xs,
      position: "absolute",
    },
    rightcard: {
      top: theme.spacing.xxs,
      right: theme.spacing.xs,
      position: "absolute",
    },
    topSecion: {
      flex: 1,
      flexDirection: "column",
      rowGap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    loginSection: {
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
      flexDirection: "column",
      gap: theme.spacing.sm,
    },
    entryContainer: {
      flex: 1,
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
    },
  });
