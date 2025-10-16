import { NavBar } from "@components";
import { Tabs } from "expo-router/tabs";
import { HomeIcon, ExploreIcon, SettingIcon } from "@components/icons";
import { Routes } from "../composable/routes";
import { useTranslation } from "@/hooks/useTranslation";

export default function TabLayout() {
  const { t } = useTranslation();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: null,
      }}
      tabBar={(props) => <NavBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          href: Routes.Home,
          tabBarLabel: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <HomeIcon fill={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          href: Routes.Map,
          tabBarLabel: t("tabs.map"),
          tabBarIcon: ({ color, size }) => <ExploreIcon fill={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          href: Routes.Account,
          tabBarLabel: t("tabs.account"),
          tabBarIcon: ({ color, size }) => <SettingIcon fill={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
