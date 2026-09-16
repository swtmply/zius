import { ExpenseDetails } from "../../expense-details";

export default async function Page({ params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  return <ExpenseDetails id={expenseId} />;
}
