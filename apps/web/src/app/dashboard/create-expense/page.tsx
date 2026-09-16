import { ExpenseForm } from "../expense-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const { groupId } = await searchParams;
  return <ExpenseForm groupId={groupId ?? ""} />;
}
