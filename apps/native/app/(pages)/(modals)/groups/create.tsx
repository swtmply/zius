import { GroupForm } from "@/components/groups/group-form/group-form";
import { GroupFormLoading } from "@/components/groups/skeletons/group-form-skeleton";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

export default function CreateGroupForm() {
  const router = useRouter();
  const participantQuery = useQuery(trpc.participant.current.queryOptions());
  const { data: currentParticipant, error } = participantQuery;

  if (error) {
    return (
      <View className="bg-page flex-1 items-center justify-center px-4">
        <View className="w-full items-center gap-4 rounded-2xl bg-panel p-4">
          <Typography selectable className="text-sm text-danger">
            Unable to load your participant details.
          </Typography>
          <View className="flex-row gap-2">
            <Button size="sm" variant="secondary" onPress={() => void participantQuery.refetch()}>
              <Button.Label>Try again</Button.Label>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
            >
              <Button.Label>Go back</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  if (!currentParticipant) {
    return <GroupFormLoading />;
  }

  return <GroupForm currentParticipant={currentParticipant} />;
}
