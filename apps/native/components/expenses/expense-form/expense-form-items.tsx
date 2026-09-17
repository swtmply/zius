import { View } from "react-native";
import { Button, Typography } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add } from "@hugeicons/core-free-icons";
import { SectionHeader } from "@/components/layout/section-header";
import { formatCurrency } from "@/utils";
import { ExpenseItemList } from "./expense-item-list";
import { createExpenseItem, sumExpenseItemPrices } from "@/utils/expenses/expense-form";
import { ExpenseFormSubscribe } from "./expense-form-subscribe";
import { useExpenseForm } from "./expense-form-context";

export function ExpenseFormItems() {
  const { form, setItems, hasSubmitted } = useExpenseForm();
  return (
    <ExpenseFormSubscribe
      form={form}
      selector={(state) =>
        [
          state.values.items,
          state.values.participants,
          state.values.splitMethod,
          state.values.totalMinor,
          state.isSubmitting,
        ] as const
      }
    >
      {([items = [], participants, splitMethod, totalMinor, isSubmitting]) => {
        const itemTotal = sumExpenseItemPrices(items);
        const hasMismatch = itemTotal !== undefined && itemTotal !== totalMinor;
        return splitMethod === "items" ? (
          <View className="gap-2">
            <SectionHeader
              title="Expense Summary"
              action={
                <Button
                  size="sm"
                  className="h-8 min-h-0 gap-2 rounded-full bg-dark-gradient px-3"
                  isDisabled={isSubmitting}
                  onPress={() =>
                    setItems([
                      ...items,
                      createExpenseItem({ name: "", quantity: 1, priceMinor: 0 }),
                    ])
                  }
                >
                  <HugeiconsIcon icon={Add} size={16} color="#FFFFFF" />
                  <Button.Label className="text-xs font-normal text-white">Add Item</Button.Label>
                </Button>
              }
            />
            <ExpenseItemList
              items={items}
              participants={participants}
              isDisabled={isSubmitting}
              showErrors={hasSubmitted}
              onChange={(index, item) => {
                setItems(items.map((current, itemIndex) => (itemIndex === index ? item : current)));
              }}
              onRemove={(index) => {
                setItems(items.filter((_, itemIndex) => itemIndex !== index));
              }}
            />
            {hasSubmitted && items.length === 0 ? (
              <Typography className="px-1 text-xs text-danger" selectable>
                Add at least one item before submitting.
              </Typography>
            ) : hasMismatch ? (
              <Typography className="px-1 text-xs text-danger" selectable>
                Items total {formatCurrency(itemTotal)} must match the expense amount{" "}
                {formatCurrency(totalMinor)}.
              </Typography>
            ) : itemTotal === undefined && hasSubmitted ? (
              <Typography className="px-1 text-xs text-danger" selectable>
                Enter valid line totals before submitting.
              </Typography>
            ) : null}
          </View>
        ) : null;
      }}
    </ExpenseFormSubscribe>
  );
}
