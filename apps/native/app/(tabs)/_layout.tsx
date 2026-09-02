import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { ActivityIndicator, View } from "react-native";

import { authClient } from "@/lib/auth-client";

type TabIconName = ComponentProps<typeof Ionicons>["name"];

type Tab = {
  name: "home" | "scan" | "add" | "notifications" | "settings";
  title: string;
  focusedIcon: TabIconName;
  icon: TabIconName;
};

const tabs: Tab[] = [
  { name: "home", title: "Home", focusedIcon: "home", icon: "home-outline" },
  { name: "scan", title: "Scan", focusedIcon: "scan", icon: "scan-outline" },
  { name: "add", title: "Add", focusedIcon: "add-circle", icon: "add-circle-outline" },
  {
    name: "notifications",
    title: "Notifications",
    focusedIcon: "notifications",
    icon: "notifications-outline",
  },
  { name: "settings", title: "Settings", focusedIcon: "settings", icon: "settings-outline" },
];

export default function TabsLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAF8",
        }}
      >
        <ActivityIndicator color="#171717" />
      </View>
    );
  }

  if (!session?.user) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#FAFAF8" },
        tabBarActiveTintColor: "#171717",
        tabBarInactiveTintColor: "#A3A3A3",
        tabBarStyle: { borderTopColor: "#E5E5E5" },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? tab.focusedIcon : tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
