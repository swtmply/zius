import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ExpenseFormContext,
  useExpenseFormController,
  type ExpenseFormProps,
} from "./expense-form-context";
import { ExpenseFormHeader } from "./expense-form-header";
import { ExpenseFormFields } from "./expense-form-fields";
import { ExpenseFormActionSection } from "./expense-form-action-section";
import { ExpenseFormParticipants } from "./expense-form-participants";
import { ExpenseFormItems } from "./expense-form-items";
import { ExpenseFormConfirmation } from "./expense-form-confirmation";

export function ExpenseForm(props: ExpenseFormProps) {
  const context = useExpenseFormController(props);
  const { form, selectGroup, submit } = context;
  return (
    <ExpenseFormContext value={context}>
      <KeyboardAwareScrollView
        bottomOffset={16}
        className="bg-page flex-1"
        contentContainerClassName="pt-safe pb-safe gap-4 px-4"
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <ExpenseFormHeader
              isSubmitting={isSubmitting || selectGroup.isPending}
              onSubmit={() => submit()}
            />
          )}
        </form.Subscribe>

        <ExpenseFormFields />
        <ExpenseFormActionSection />
        <View className="gap-2">
          <ExpenseFormParticipants />
          <ExpenseFormItems />
        </View>
        <ExpenseFormConfirmation />
      </KeyboardAwareScrollView>
    </ExpenseFormContext>
  );
}
