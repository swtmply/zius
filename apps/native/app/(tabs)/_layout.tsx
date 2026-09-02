import {
  Add,
  Home04Icon,
  Notification,
  Scan,
  Settings,
} from "@hugeicons/core-free-icons";
import type { HugeiconsProps } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, ColorValue, View } from "react-native";

import { authClient } from "@/lib/auth-client";

type TabIconProps = {
  icon: HugeiconsProps["icon"];
  name: string;
  size: number;
  focused: boolean;
  color?: ColorValue;
};

const tabs: TabIconProps[] = [
  { icon: Home04Icon, name: "home", size: 24, focused: false },
  { icon: Scan, name: "scan", size: 24, focused: false },
  { icon: Add, name: "add", size: 24, focused: false },
  { icon: Notification, name: "notifications", size: 24, focused: false },
  { icon: Settings, name: "settings", size: 24, focused: false },
];

export function TabIcon({ icon, color, size, focused }: TabIconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      color={color}
      size={size}
      strokeWidth={focused ? 2.5 : 1.8}
    />
  );
}

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
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#8A8A8E",
        tabBarStyle: {
          borderTopColor: "#E5E5E5",
          paddingTop: 16,
          height: 75,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ color, focused, size }) => (
              <TabIcon
                name={tab.name}
                icon={tab.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
