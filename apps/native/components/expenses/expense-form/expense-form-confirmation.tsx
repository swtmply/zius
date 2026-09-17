import { BottomSheet, Button, PressableFeedback, Typography } from "heroui-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XIcon } from "@hugeicons/core-free-icons";
import { useExpenseForm } from "./expense-form-context";

import { Icon } from "@/components/icon";

export function ExpenseFormConfirmation() {
  const insets = useSafeAreaInsets();
  const { form, isGroupDialogOpen, setIsGroupDialogOpen, groupChoice, setGroupChoice, submit } =
    useExpenseForm();
  return (
    <BottomSheet isOpen={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          detached
          bottomInset={insets.bottom + 12}
          className="mx-4 overflow-hidden"
          backgroundClassName="rounded-3xl"
          contentContainerClassName="gap-5 p-5"
          enableDynamicSizing
          handleComponent={null}
        >
          <View className="flex-row items-start gap-3">
            <View className="flex-1 gap-1">
              <BottomSheet.Title>Confirm Expense</BottomSheet.Title>
              <BottomSheet.Description>
                Select what to do with this expense.
              </BottomSheet.Description>
            </View>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              accessibilityLabel="Close expense confirmation"
              onPress={() => setIsGroupDialogOpen(false)}
            >
              <Icon icon={XIcon} colorClassName="accent-ink" />
            </Button>
          </View>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <>
                <View className="gap-4" accessibilityRole="radiogroup">
                  <PressableFeedback
                    accessibilityRole="radio"
                    accessibilityState={{ checked: groupChoice === "group" }}
                    isDisabled={isSubmitting}
                    onPress={() => setGroupChoice("group")}
                    className={`gap-3 rounded-3xl border-2 bg-surface-secondary p-5 ${
                      groupChoice === "group" ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <Typography className="font-medium">Create new group</Typography>
                    <Typography className="text-muted leading-6">
                      Creates a new group with the selected participants and adds this expense to
                      it. The expense title will be the group name.
                    </Typography>
                  </PressableFeedback>
                  <PressableFeedback
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: groupChoice === "standalone",
                    }}
                    isDisabled={isSubmitting}
                    onPress={() => setGroupChoice("standalone")}
                    className={`gap-3 rounded-3xl border-2 bg-surface-secondary p-5 ${
                      groupChoice === "standalone" ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <Typography className="font-medium">Create standalone expense</Typography>
                    <Typography className="text-muted leading-6">
                      Creates a one-off expense. This will only be available on dashboard and
                      history.
                    </Typography>
                  </PressableFeedback>
                </View>
                <Button
                  className="rounded-2xl bg-foreground"
                  isDisabled={isSubmitting}
                  onPress={() => submit({ groupChoice })}
                >
                  <Button.Label className="text-background">
                    {isSubmitting ? "Creating expense..." : "Submit"}
                  </Button.Label>
                </Button>
              </>
            )}
          </form.Subscribe>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
