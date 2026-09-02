import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#FAFAF8",
      }}
    >
      <View style={{ width: "100%", maxWidth: 360, alignItems: "center", gap: 12 }}>
        <Text selectable style={{ color: "#171717", fontSize: 28, fontWeight: "800" }}>
          Page not found
        </Text>
        <Text selectable style={{ color: "#737373", fontSize: 16, textAlign: "center" }}>
          This page does not exist.
        </Text>
        <Link href="/" asChild>
          <Pressable
            style={({ pressed }) => ({
              height: 48,
              marginTop: 12,
              paddingHorizontal: 24,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: "#171717",
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Go home</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
