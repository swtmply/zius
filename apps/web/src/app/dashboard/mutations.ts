import { queryClient, trpc } from "@/utils/trpc";

export async function refreshDashboard() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: trpc.expense.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.group.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
  ]);
}
