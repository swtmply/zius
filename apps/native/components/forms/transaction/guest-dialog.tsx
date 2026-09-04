import { Button, Dialog, FieldError, Label, TextField } from "heroui-native";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { z } from "zod";

const guestSchema = z.object({
  name: z.string().trim().min(1, "Enter the guest's name"),
  email: z.email("Enter a valid email address"),
});

export type Guest = z.infer<typeof guestSchema>;

type GuestDialogProps = {
  onSubmit: (guest: Guest) => void;
};

export function GuestDialog({ onSubmit }: GuestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Guest, string>>>({});

  const reset = () => {
    setName("");
    setEmail("");
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      reset();
    }
  };

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
    handleOpenChange(false);
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <Button.Label>Add Guest</Button.Label>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <KeyboardAwareScrollView
            bottomOffset={16}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <Dialog.Content>
              <View className="gap-1">
                <Dialog.Title>Add guest</Dialog.Title>
              </View>

              <View className="gap-4">
                <TextField isRequired isInvalid={Boolean(errors.name)}>
                  <Label>Name</Label>
                  <TextInput
                    autoCapitalize="words"
                    autoComplete="name"
                    autoFocus
                    value={name}
                    onChangeText={(value) => {
                      setName(value);
                      setErrors((current) => ({ ...current, name: undefined }));
                    }}
                    placeholder="Guest name"
                    returnKeyType="next"
                    className="border border-border rounded-xl px-3 text-sm"
                  />
                  <FieldError>{errors.name}</FieldError>
                </TextField>

                <TextField isRequired isInvalid={Boolean(errors.email)}>
                  <Label>Email</Label>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setErrors((current) => ({ ...current, email: undefined }));
                    }}
                    onSubmitEditing={handleSubmit}
                    placeholder="guest@example.com"
                    returnKeyType="done"
                    className="border border-border rounded-xl px-3 text-sm"
                  />
                  <FieldError>{errors.email}</FieldError>
                </TextField>

                <View className="flex-row items-center justify-end gap-1 pt-2">
                  <Button variant="ghost" onPress={() => handleOpenChange(false)}>
                    <Button.Label>Cancel</Button.Label>
                  </Button>
                  <Button onPress={handleSubmit}>
                    <Button.Label>Add guest</Button.Label>
                  </Button>
                </View>
              </View>
            </Dialog.Content>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </Dialog.Portal>
    </Dialog>
  );
}
