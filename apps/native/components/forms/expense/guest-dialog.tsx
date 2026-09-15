import { Add, X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BottomSheet, Button, Typography, useBottomSheetAwareHandlers } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Keyboard, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const guestSchema = z.object({
  name: z.string().trim().min(1, "Enter the guest's name"),
  email: z.email("Enter a valid email address"),
});

export type Guest = z.infer<typeof guestSchema>;

type GuestDialogProps = {
  onSubmit: (guest: Guest) => void;
  title?: string;
  triggerLabel?: string;
  submitLabel?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  compact?: boolean;
};

type GuestSheetContentProps = {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  onSubmit: (guest: Guest) => void;
  onClose: () => void;
};

function GuestSheetContent({
  isOpen,
  title,
  submitLabel,
  namePlaceholder,
  emailPlaceholder,
  onSubmit,
  onClose,
}: GuestSheetContentProps) {
  // Keep keystrokes below the portal so they do not republish the entire sheet.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Guest, string>>>({});
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  useEffect(() => {
    if (!isOpen) {
      nameInputRef.current?.blur();
      emailInputRef.current?.blur();
      setName("");
      setEmail("");
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const result = guestSchema.safeParse({ name, email });

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
      });
      return;
    }

    onSubmit(result.data);
    onClose();
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-4">
        <BottomSheet.Title className="text-lg font-normal text-ink">{title}</BottomSheet.Title>
        <Button
          isIconOnly
          variant="secondary"
          className="size-8 rounded-full bg-page"
          accessibilityLabel={`Close ${title.toLowerCase()} sheet`}
          onPress={onClose}
        >
          <HugeiconsIcon icon={X} size={16} color="#000000" />
        </Button>
      </View>

      <View className="gap-4">
        <View className="gap-1">
          <View
            className={`bg-page h-14 flex-row items-center gap-1 rounded-2xl border px-4 ${
              errors.name ? "border-danger" : "border-transparent"
            }`}
          >
            <Typography className="text-sm text-ink">Name</Typography>
            <TextInput
              ref={nameInputRef}
              testID="guest-name-input"
              accessibilityLabel={namePlaceholder}
              autoCapitalize="words"
              autoComplete="name"
              value={name}
              onBlur={onBlur}
              onChangeText={(value) => {
                setName(value);
                if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
              }}
              onFocus={onFocus}
              onSubmitEditing={() => emailInputRef.current?.focus()}
              placeholder={namePlaceholder}
              placeholderTextColor="#8A8A8E"
              returnKeyType="next"
              className="flex-1 text-sm text-ink"
            />
          </View>
          {errors.name ? (
            <Typography className="px-1 text-xs text-danger">{errors.name}</Typography>
          ) : null}
        </View>

        <View className="gap-1">
          <View
            className={`bg-page h-14 flex-row items-center gap-1 rounded-2xl border px-4 ${
              errors.email ? "border-danger" : "border-transparent"
            }`}
          >
            <Typography className="text-sm text-ink">Email</Typography>
            <TextInput
              ref={emailInputRef}
              testID="guest-email-input"
              accessibilityLabel={emailPlaceholder}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onBlur={onBlur}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
              }}
              onFocus={onFocus}
              onSubmitEditing={handleSubmit}
              placeholder={emailPlaceholder}
              placeholderTextColor="#8A8A8E"
              returnKeyType="done"
              className="flex-1 text-sm text-ink"
            />
          </View>
          {errors.email ? (
            <Typography className="px-1 text-xs text-danger">{errors.email}</Typography>
          ) : null}
        </View>

        <Button className="w-full bg-dark-gradient" onPress={handleSubmit}>
          <Button.Label>{submitLabel}</Button.Label>
        </Button>
      </View>
    </View>
  );
}

export function GuestDialog({
  onSubmit,
  title = "Add guest",
  triggerLabel = "Add Guest",
  submitLabel = "Add guest",
  namePlaceholder = "Guest name",
  emailPlaceholder = "guest@example.com",
  compact = false,
}: GuestDialogProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    Keyboard.dismiss();
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <BottomSheet.Trigger asChild>
        <Button
          size="sm"
          className={`min-h-0 rounded-full bg-dark-gradient ${
            compact ? "h-7 gap-1 px-2" : "h-8 gap-2 px-3"
          }`}
        >
          <HugeiconsIcon icon={Add} size={compact ? 14 : 16} color="#FFFFFF" />
          <Button.Label className={`font-normal text-white ${compact ? "text-[10px]" : "text-xs"}`}>
            {triggerLabel}
          </Button.Label>
        </Button>
      </BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          detached
          bottomInset={insets.bottom + 12}
          className="mx-4 overflow-hidden"
          backgroundClassName="rounded-[32px]"
          contentContainerClassName="gap-4 p-4"
          enableDynamicSizing
          handleComponent={null}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
        >
          <GuestSheetContent
            isOpen={isOpen}
            title={title}
            submitLabel={submitLabel}
            namePlaceholder={namePlaceholder}
            emailPlaceholder={emailPlaceholder}
            onSubmit={onSubmit}
            onClose={() => handleOpenChange(false)}
          />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
