import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useRef, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

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

function AuthField({ inputRef, label, ...inputProps }: AuthFieldProps) {
  return (
    <View
      style={{
        height: 54,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        borderCurve: "continuous",
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 9px 26px rgba(0, 0, 0, 0.12)",
      }}
    >
      <Text style={{ width: 82, color: "#171717", fontSize: 14 }}>{label}</Text>
      <TextInput
        ref={inputRef}
        placeholderTextColor="#C4C4C7"
        style={{ flex: 1, height: "100%", color: "#171717", fontSize: 14 }}
        {...inputProps}
      />
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
            onSuccess() {
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
          onSuccess() {
            router.replace("/home");
          },
        },
      );
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
      <Text
        selectable
        style={{
          color: "#000000",
          fontSize: 24,
          fontWeight: "600",
          letterSpacing: -0.5,
          textAlign: "center",
        }}
      >
        Zius
      </Text>

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
                placeholder="Email"
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
                <Text selectable style={{ color: "#DC2626", fontSize: 12 }}>
                  {submissionError}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void form.handleSubmit()}
                style={({ pressed }) => ({
                  height: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  borderCurve: "continuous",
                  backgroundColor: "#000000",
                  opacity: pressed || isSubmitting ? 0.72 : 1,
                })}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                    {isSignUp ? "Create Account" : "Login your account"}
                  </Text>
                )}
              </Pressable>

              <Text selectable style={{ color: "#929292", fontSize: 12 }}>
                {isSignUp ? "Already have an account?" : "Don't have an account yet?"}
              </Text>

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
                  backgroundColor: "#ECECEC",
                  opacity: pressed || isSubmitting ? 0.72 : 1,
                })}
              >
                <Text style={{ color: "#111111", fontSize: 14 }}>
                  {isSignUp ? "Login your account" : "Create account"}
                </Text>
              </Pressable>
            </>
          )}
        </form.Subscribe>
      </View>
    </View>
  );
}
