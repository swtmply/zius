import { GroupDetails } from "../../group-details";

export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <GroupDetails id={groupId} />;
}
