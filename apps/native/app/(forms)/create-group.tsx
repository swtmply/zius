import { GroupForm } from "@/components/forms/group/group-form";
import { GroupFormLoading } from "@/components/forms/group/group-form-loading";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "heroui-native";
import { View } from "react-native";

export default function CreateGroupForm() {
  const { data: currentParticipant, error } = useQuery(trpc.participant.current.queryOptions());

  if (error) {
    return (
      <View className="bg-page flex-1 items-center justify-center px-4">
        <View className="rounded-2xl bg-panel p-4">
          <Typography selectable className="text-sm text-danger">
            Unable to load your participant details.
          </Typography>
        </View>
      </View>
    );
  }

  if (!currentParticipant) {
    return <GroupFormLoading />;
  }

  return <GroupForm currentParticipant={currentParticipant} />;
}
