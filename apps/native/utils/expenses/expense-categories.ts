import {
  Airplane01Icon,
  Car01Icon,
  GlassWaterIcon,
  ReceiptTextIcon,
  Restaurant01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeiconsProps } from "@hugeicons/react-native";
import {
  expenseCategories,
  expenseCategoryNames,
  type ExpenseIconName,
} from "@zius/api/expense-categories";

const expenseIcons = {
  Airplane01Icon,
  Car01Icon,
  GlassWaterIcon,
  ReceiptTextIcon,
  Restaurant01Icon,
  ShoppingBag01Icon,
} satisfies Record<ExpenseIconName, HugeiconsProps["icon"]>;

export function resolveExpenseIcon(name: string) {
  const entry = Object.entries(expenseIcons).find(([iconName]) => iconName === name);
  return entry?.[1] ?? ReceiptTextIcon;
}

export const categoryOptions = expenseCategoryNames.map((value) => ({
  value,
  label: expenseCategories[value].label,
  icon: resolveExpenseIcon(expenseCategories[value].iconName),
}));
