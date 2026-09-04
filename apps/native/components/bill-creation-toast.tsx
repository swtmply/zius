import { Toast, type ToastComponentProps } from "heroui-native";
import { View } from "react-native";

type BillCreationToastProps = ToastComponentProps & {
  variant: "success" | "danger";
  description: string;
  title?: string;
};

export function BillCreationToast({
  variant,
  description,
  title,
  ...props
}: BillCreationToastProps) {
  const isSuccess = variant === "success";

  return (
    <Toast
      {...props}
      variant={variant}
      placement="top"
      className={`flex-row items-center gap-4 rounded-3xl border px-4 py-4 shadow-none ${
        isSuccess ? "border-[#2dcc55] bg-[#d7f5df]" : "border-[#ef4444] bg-[#fee2e2]"
      }`}
    >
      <View className="flex-1 gap-1">
        <Toast.Title
          className={`text-sm font-normal ${isSuccess ? "text-[#2dcc55]" : "text-[#dc2626]"}`}
        >
          {title ?? (isSuccess ? "Bill created successfully" : "Failed to create bill")}
        </Toast.Title>
        <Toast.Description className="text-xs text-black">{description}</Toast.Description>
      </View>
      <Toast.Close
        className={`size-6 min-h-0 min-w-0 rounded-full p-0 ${isSuccess ? "bg-[#2dcc55]" : "bg-[#ef4444]"}`}
        iconProps={{ size: 16, color: "#ffffff" }}
        hitSlop={10}
        accessibilityLabel="Dismiss notification"
      />
    </Toast>
  );
}
