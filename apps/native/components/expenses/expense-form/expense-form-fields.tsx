import { CurrencyInput } from "./expense-currency-input";
import { ExpenseTitleInput } from "./expense-title-input";
import { createExpenseSchema } from "@/utils/expenses/expense-form";
import { useExpenseForm } from "./expense-form-context";

export function ExpenseFormFields() {
  const { form, hasSubmitted, recalculateParticipantAmounts } = useExpenseForm();
  return (
    <>
      <form.Field name="totalMinor">
        {(field) => (
          <CurrencyInput
            value={field.state.value}
            onBlur={() => {
              field.handleBlur();
              recalculateParticipantAmounts();
            }}
            errorMessage={
              hasSubmitted || field.state.meta.isBlurred
                ? createExpenseSchema.shape.totalMinor.safeParse(field.state.value).error?.issues[0]
                    ?.message
                : undefined
            }
            onValueChange={field.handleChange}
          />
        )}
      </form.Field>

      <form.Field name="title">
        {(field) => (
          <ExpenseTitleInput
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            errorMessage={
              hasSubmitted || field.state.meta.isBlurred
                ? createExpenseSchema.shape.title.safeParse(field.state.value).error?.issues[0]
                    ?.message
                : undefined
            }
          />
        )}
      </form.Field>
    </>
  );
}
