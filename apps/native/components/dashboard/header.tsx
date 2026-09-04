import { View } from "react-native";
import React from "react";
import { Avatar, Typography } from "heroui-native";
import { authClient } from "@/lib/auth-client";

export default function DashboardHeader() {
  const { data: session } = authClient.useSession();

  return (
    <View className="pt-8 flex-row justify-between items-center">
      <Typography className="text-2xl font-semibold">Dashboard</Typography>

      <Avatar size="md">
        <Avatar.Image source={{ uri: session?.user?.image ?? "" }} />
        <Avatar.Fallback>{session?.user?.name[0]}</Avatar.Fallback>
      </Avatar>
    </View>
  );
}
