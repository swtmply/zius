import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Toast, type ToastComponentProps, type ToastManager } from "heroui-native";
import { ActivityIndicator, View } from "react-native";

import { Icon } from "@/components/icon";

type ExpenseCreationToastProps = ToastComponentProps & {
  variant: "success" | "danger" | "default";
  description: string;
  title?: string;
};

export function ExpenseCreationToast({
  variant,
  description,
  title,
  ...props
}: ExpenseCreationToastProps) {
  const isSuccess = variant === "success";
  const isPending = variant === "default";

  return (
    <Toast
      {...props}
      variant={variant}
      placement="bottom"
      className="flex-row items-center gap-4 rounded-3xl bg-panel px-4 py-4 shadow-none"
    >
      <View className="flex-1 gap-1">
        <Toast.Title className="text-sm font-normal text-ink">
          {title ?? (isSuccess ? "Expense created successfully" : "Failed to create expense")}
        </Toast.Title>
        <Toast.Description className="text-xs text-supporting">{description}</Toast.Description>
      </View>
      {isPending ? (
        <View className="size-9 items-center justify-center">
          <ActivityIndicator colorClassName="accent-ink" size="small" />
        </View>
      ) : (
        <Toast.Close
          className="size-9 min-h-0 min-w-0 rounded-full bg-page p-0"
          hitSlop={10}
          accessibilityLabel="Dismiss notification"
        >
          <Icon colorClassName="accent-ink" icon={Cancel01Icon} size={20} />
        </Toast.Close>
      )}
    </Toast>
  );
}

/**
 * Persistent toast shown while a submission is in flight.
 * Dismiss it with `toast.hide("all")`: `hide(id)` only removes toasts present in the
 * `toast` manager captured by the current render, and a handler that shows and hides
 * in the same closure never sees its own toast (heroui-native provider.tsx).
 */
export function showPendingToast(toast: ToastManager, title: string, description: string) {
  return toast.show({
    duration: "persistent",
    component: (props) => (
      <ExpenseCreationToast {...props} variant="default" title={title} description={description} />
    ),
  });
}
