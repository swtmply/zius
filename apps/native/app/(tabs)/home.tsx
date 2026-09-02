import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { ScrollView } from "react-native";
import { Typography } from "heroui-native";

export default function Home() {
  const { data } = useQuery(trpc.dashboard.get.queryOptions());

  return null;
}
