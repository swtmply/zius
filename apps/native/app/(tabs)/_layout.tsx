import { Add, Home04Icon, Notification, Scan, Settings } from "@hugeicons/core-free-icons";
import type { HugeiconsProps } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Redirect, Tabs, useRouter } from "expo-router";
import type { ColorValue } from "react-native";
import DashboardLoading from "@/components/dashboard/loading";

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
  return <HugeiconsIcon icon={icon} color={color} size={size} strokeWidth={focused ? 2.5 : 1.8} />;
}

export default function TabsLayout() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return <DashboardLoading />;
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
          listeners={
            tab.name === "add"
              ? {
                  tabPress: (event) => {
                    event.preventDefault();
                    router.push("/create-transaction");
                  },
                }
              : undefined
          }
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name={tab.name}
                icon={tab.icon}
                color={color}
                size={tab.size}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
