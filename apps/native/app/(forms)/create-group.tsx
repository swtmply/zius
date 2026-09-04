import { GroupForm } from "@/components/forms/group/group-form";
import { FormLoading } from "@/components/forms/form-loading";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "heroui-native";
import { View } from "react-native";

export default function CreateGroupForm() {
  const { data: currentParticipant, error } = useQuery(trpc.participant.current.queryOptions());

  if (error) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Typography selectable className="text-sm text-danger">
          Unable to load your participant details.
        </Typography>
      </View>
    );
  }

  if (!currentParticipant) {
    return <FormLoading />;
  }

  return <GroupForm currentParticipant={currentParticipant} />;
}
