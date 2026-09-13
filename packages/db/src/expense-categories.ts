export const expenseCategoryNames = [
  "food",
  "transportation",
  "travel",
  "drinks",
  "shopping",
  "others",
] as const;

// Only names cross the database/API boundary. Icon data stays in the client.
export const expenseCategories = {
  food: { label: "Food", iconName: "Restaurant01Icon" },
  transportation: { label: "Transportation", iconName: "Car01Icon" },
  travel: { label: "Travel", iconName: "Airplane01Icon" },
  drinks: { label: "Drinks & Beverages", iconName: "GlassWaterIcon" },
  shopping: { label: "Shopping", iconName: "ShoppingBag01Icon" },
  others: { label: "Others", iconName: "ReceiptTextIcon" },
} as const;

export type ExpenseCategory = keyof typeof expenseCategories;
export type ExpenseIconName = (typeof expenseCategories)[ExpenseCategory]["iconName"];
