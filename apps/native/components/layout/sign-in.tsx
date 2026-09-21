import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "@/utils/navigation";
import { Typography, useToast } from "heroui-native";
import { useRef, useState, type RefObject } from "react";
import { ActivityIndicator, Pressable, TextInput, View, type TextInputProps } from "react-native";
import { useCSSVariable } from "uniwind";
import { z } from "zod";

import { Icon } from "@/components/icon";
import { showPendingToast } from "@/components/layout/expense-creation-toast";
import { authClient } from "@/lib/auth-client";
import { clearPersistedQueryCache } from "@/utils/trpc";

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

type AuthMode = "sign-in" | "sign-up";

type AuthFieldProps = TextInputProps & {
  inputRef?: RefObject<TextInput | null>;
  label: string;
};

function AuthField({ inputRef, label, style, secureTextEntry, ...inputProps }: AuthFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View
      className="bg-panel"
      style={{
        height: 54,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        borderCurve: "continuous",
        paddingHorizontal: 16,
        boxShadow: "0 9px 26px rgba(0, 0, 0, 0.12)",
      }}
    >
      <Typography className="w-[82px] text-sm text-ink">{label}</Typography>
      <TextInput
        {...inputProps}
        secureTextEntry={secureTextEntry && !visible}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        ref={inputRef}
        placeholderTextColorClassName="accent-muted"
        className="h-full flex-1 text-sm text-ink"
        style={[{ flex: 1, height: "100%" }, style]}
      />
      {secureTextEntry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          accessibilityState={{ selected: visible }}
          hitSlop={12}
          onPress={() => setVisible((v) => !v)}
          style={({ pressed }) => ({ paddingLeft: 12, opacity: pressed ? 0.6 : 1 })}
        >
          <Icon
            icon={visible ? ViewOffSlashIcon : ViewIcon}
            size={18}
            colorClassName="accent-muted"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SignIn() {
  const router = useRouter();
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { toast } = useToast();
  const [ink, panel] = useCSSVariable(["--ink", "--panel"]) as Array<string>;

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null);

      const result =
        mode === "sign-up" ? signUpSchema.safeParse(value) : signInSchema.safeParse(value);

      if (!result.success) {
        setSubmissionError(result.error.issues[0]?.message ?? "Check your details and try again");
        return;
      }

      showPendingToast(
        toast,
        mode === "sign-up" ? "Creating your account" : "Signing you in",
        "This only takes a moment.",
      );

      try {
        if (mode === "sign-up") {
          await authClient.signUp.email(
            {
              name: value.name.trim(),
              email: value.email.trim(),
              password: value.password,
            },
            {
              onError(error) {
                setSubmissionError(error.error.message ?? "Unable to create your account");
              },
              async onSuccess() {
                await clearPersistedQueryCache();
                router.replace("/home");
              },
            },
          );
          return;
        }

        await authClient.signIn.email(
          {
            email: value.email.trim(),
            password: value.password,
          },
          {
            onError(error) {
              setSubmissionError(error.error.message ?? "Unable to log in");
            },
            async onSuccess() {
              await clearPersistedQueryCache();
              router.replace("/home");
            },
          },
        );
      } finally {
        toast.hide("all");
      }
    },
  });

  const isSignUp = mode === "sign-up";

  function switchMode() {
    setMode(isSignUp ? "sign-in" : "sign-up");
    setSubmissionError(null);
    form.reset();
  }

  return (
    <View style={{ width: "100%", maxWidth: 420, gap: 16 }}>
      <Typography
        selectable
        className="text-center text-2xl font-semibold tracking-[-0.5px] text-ink"
      >
        Zius
      </Typography>

      <View style={{ gap: 16 }}>
        {isSignUp ? (
          <form.Field name="name">
            {(field) => (
              <AuthField
                inputRef={nameInputRef}
                label="Name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                onSubmitEditing={() => emailInputRef.current?.focus()}
                placeholder="Name"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                blurOnSubmit={false}
              />
            )}
          </form.Field>
        ) : null}

        <form.Field name="email">
          {(field) => (
            <AuthField
              testID="auth-email"
              inputRef={emailInputRef}
              label="Email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <AuthField
              testID="auth-password"
              inputRef={passwordInputRef}
              label="Password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              onSubmitEditing={() => void form.handleSubmit()}
              placeholder="Password"
              secureTextEntry
              autoComplete={isSignUp ? "new-password" : "password"}
              textContentType={isSignUp ? "newPassword" : "password"}
              returnKeyType="go"
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <>
              {submissionError ? (
                <Typography selectable className="text-xs text-danger">
                  {submissionError}
                </Typography>
              ) : null}

              <Pressable
                testID={isSignUp ? "auth-sign-up" : "auth-login"}
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void form.handleSubmit()}
                style={({ pressed }) => ({
                  height: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  borderCurve: "continuous",
                  backgroundColor: ink,
                  opacity: pressed || isSubmitting ? 0.72 : 1,
                })}
              >
                {isSubmitting ? (
                  <ActivityIndicator colorClassName="accent-on-ink" />
                ) : (
                  <Typography className="text-sm text-on-ink">
                    {isSignUp ? "Create Account" : "Login your account"}
                  </Typography>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={switchMode}
                style={({ pressed }) => ({
                  height: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 15,
                  borderCurve: "continuous",
                  backgroundColor: panel,
                  opacity: pressed || isSubmitting ? 0.72 : 1,
                })}
              >
                <Typography className="text-sm text-ink">
                  {isSignUp ? "Login your account" : "Create account"}
                </Typography>
              </Pressable>
            </>
          )}
        </form.Subscribe>
      </View>
    </View>
  );
}
