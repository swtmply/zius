import { Typography } from "heroui-native";
import { ExpenseFormActions } from "./expense-form-actions";
import { ExpenseFormSubscribe } from "./expense-form-subscribe";
import { useExpenseForm } from "./expense-form-context";

export function ExpenseFormActionSection() {
  const {
    form,
    group,
    categoryResetKey,
    categoryRef,
    selectGroup,
    setSplitMethod,
    setGroupMemberEmails,
  } = useExpenseForm();
  return (
    <ExpenseFormSubscribe
      form={form}
      selector={(state) =>
        [
          state.values.payer,
          state.values.group_id,
          state.values.splitMethod,
          state.isSubmitting,
          ...state.values.participants.flatMap(({ id, name, email, image }) => [
            id,
            name,
            email,
            image,
          ]),
        ] as const
      }
    >
      {([payer, groupId, splitMethod, isSubmitting]) => (
        <>
          <ExpenseFormActions
            participants={form.state.values.participants}
            payer={payer}
            splitMethod={splitMethod}
            groupId={groupId}
            groupName={group?.name}
            categoryResetKey={categoryResetKey}
            isDisabled={isSubmitting || selectGroup.isPending}
            onPayerChange={(email) => form.setFieldValue("payer", email)}
            onSplitMethodChange={setSplitMethod}
            onGroupChange={(nextGroupId) => {
              if (nextGroupId === groupId || isSubmitting || selectGroup.isPending) return;
              selectGroup.reset();
              if (nextGroupId) {
                selectGroup.mutate(nextGroupId);
              } else {
                form.setFieldValue("group_id", undefined);
                setGroupMemberEmails([]);
              }
            }}
            onCategoryChange={(nextCategory) => {
              categoryRef.current = nextCategory;
            }}
          />
          {selectGroup.isPending ? (
            <Typography className="px-1 text-xs text-supporting">
              Loading group participants...
            </Typography>
          ) : null}
          {selectGroup.isError ? (
            <Typography className="px-1 text-xs text-danger">
              Unable to load this group. Open Groups to try again.
            </Typography>
          ) : null}
        </>
      )}
    </ExpenseFormSubscribe>
  );
}
