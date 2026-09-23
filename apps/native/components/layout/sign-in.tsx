import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "@/utils/navigation";
import {
  Button,
  InputGroup,
  PressableFeedback,
  Typography,
  useToast,
} from "heroui-native";
import { useRef, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Image,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
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

const EMAIL_VERIFICATION_CALLBACK = "/email-verified";

type AuthFieldProps = TextInputProps & {
  inputRef?: RefObject<TextInput | null>;
  label: string;
};

function AuthField({
  inputRef,
  label,
  style,
  secureTextEntry,
  ...inputProps
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className="h-[54px] rounded-2xl bg-panel shadow-[0_9px_26px_rgba(0,0,0,0.12)]">
      <InputGroup.Prefix isDecorative className="pl-4 pr-0">
        <Typography className="w-[82px] text-sm text-ink">{label}</Typography>
      </InputGroup.Prefix>
      <InputGroup.Input
        {...inputProps}
        secureTextEntry={secureTextEntry && !visible}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        ref={inputRef}
        placeholderColorClassName="accent-muted"
        background={null}
        className="h-full rounded-2xl border-0 bg-transparent text-sm text-ink android:border-0"
        style={style}
      />
      {secureTextEntry ? (
        <InputGroup.Suffix className="pl-0 pr-4">
          <PressableFeedback
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            accessibilityState={{ selected: visible }}
            hitSlop={12}
            onPress={() => setVisible((v) => !v)}
            className="pl-3"
          >
            <Icon
              icon={visible ? ViewOffSlashIcon : ViewIcon}
              size={18}
              colorClassName="accent-muted"
            />
          </PressableFeedback>
        </InputGroup.Suffix>
      ) : null}
    </InputGroup>
  );
}

function VerificationPending({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    setIsSending(true);
    setMessage(null);

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: EMAIL_VERIFICATION_CALLBACK,
      });
      setMessage(result.error?.message ?? "Verification email sent");
    } catch {
      setMessage("Unable to resend the verification email");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View className="w-full max-w-[420px] gap-4">
      <View className="items-center gap-1">
        <Typography className="text-center text-2xl font-semibold text-ink">
          Check your inbox
        </Typography>
        <Typography selectable className="text-center text-xs text-muted">
          We sent a verification link to {email}. Open it on this device to
          continue automatically.
        </Typography>
      </View>

      {message ? (
        <Typography selectable className="text-center text-xs text-muted">
          {message}
        </Typography>
      ) : null}

      <Button
        isDisabled={isSending}
        onPress={() => void resend()}
        className="h-[54px] rounded-2xl bg-ink disabled:opacity-72"
      >
        {isSending ? (
          <ActivityIndicator colorClassName="accent-on-ink" />
        ) : (
          <Button.Label className="text-sm text-on-ink">
            Resend email
          </Button.Label>
        )}
      </Button>

      <Button
        variant="secondary"
        isDisabled={isSending}
        onPress={onBack}
        className="h-[52px] rounded-2xl bg-panel disabled:opacity-72"
      >
        <Button.Label className="text-sm text-ink">Back to login</Button.Label>
      </Button>
    </View>
  );
}

export function SignIn() {
  const router = useRouter();
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(null);

      const result =
        mode === "sign-up"
          ? signUpSchema.safeParse(value)
          : signInSchema.safeParse(value);

      if (!result.success) {
        setSubmissionError(
          result.error.issues[0]?.message ?? "Check your details and try again",
        );
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
              callbackURL: EMAIL_VERIFICATION_CALLBACK,
            },
            {
              onError(error) {
                setSubmissionError(
                  error.error.message ?? "Unable to create your account",
                );
              },
              async onSuccess() {
                setPendingEmail(value.email.trim());
                await clearPersistedQueryCache();
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
            async onSuccess({ data }) {
              if (!data?.user.emailVerified) {
                try {
                  const result = await authClient.sendVerificationEmail({
                    email: value.email.trim(),
                    callbackURL: EMAIL_VERIFICATION_CALLBACK,
                  });
                  if (result.error) {
                    setSubmissionError(
                      result.error.message ?? "Unable to send verification email",
                    );
                    return;
                  }
                  await clearPersistedQueryCache();
                  setPendingEmail(value.email.trim());
                } catch {
                  setSubmissionError("Unable to send verification email");
                }
                return;
              }

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

  async function signInWithGoogle() {
    setIsGooglePending(true);
    setSubmissionError(null);
    showPendingToast(
      toast,
      "Opening Google",
      "Choose the account you want to use.",
    );

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
      });

      if (result.error) {
        setSubmissionError(
          result.error.message ?? "Unable to sign in with Google",
        );
        return;
      }

      const { data: session } = await authClient.getSession();
      if (session?.user.emailVerified) {
        await clearPersistedQueryCache();
        router.replace("/home");
      }
    } catch {
      setSubmissionError("Unable to sign in with Google");
    } finally {
      setIsGooglePending(false);
      toast.hide("all");
    }
  }

  if (pendingEmail) {
    return (
      <VerificationPending
        email={pendingEmail}
        onBack={() => {
          setPendingEmail(null);
          setMode("sign-in");
          form.reset();
        }}
      />
    );
  }

  return (
    <View className="w-full max-w-[420px] gap-4">
      <Typography
        selectable
        className="text-center text-2xl font-semibold tracking-[-0.5px] text-ink"
      >
        Zius
      </Typography>

      <View className="gap-4">
        <Button
          variant="secondary"
          isDisabled={isGooglePending}
          onPress={() => void signInWithGoogle()}
          className="h-[54px] flex-row gap-0 rounded-2xl bg-panel disabled:opacity-72"
        >
          {isGooglePending ? (
            <ActivityIndicator colorClassName="accent-ink" />
          ) : (
            <Image
              accessible={false}
              source={require("../../assets/images/google-icon.png")}
              className="size-[52px]"
            />
          )}
          <Button.Label className="text-sm text-ink">
            {isGooglePending ? "Opening Google..." : "Continue with Google"}
          </Button.Label>
        </Button>

        <View className="flex-row items-center gap-3" accessible={false}>
          <View className="h-px flex-1 bg-border" />
          <Typography className="text-xs text-muted">
            or continue with email
          </Typography>
          <View className="h-px flex-1 bg-border" />
        </View>

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

              <Button
                testID={isSignUp ? "auth-sign-up" : "auth-login"}
                isDisabled={isSubmitting || isGooglePending}
                onPress={() => void form.handleSubmit()}
                className="h-[54px] rounded-2xl bg-ink disabled:opacity-72"
              >
                {isSubmitting ? (
                  <ActivityIndicator colorClassName="accent-on-ink" />
                ) : (
                  <Button.Label className="text-sm text-on-ink">
                    {isSignUp ? "Create Account" : "Login your account"}
                  </Button.Label>
                )}
              </Button>

              <Button
                variant="secondary"
                isDisabled={isSubmitting || isGooglePending}
                onPress={switchMode}
                className="h-[52px] rounded-2xl bg-panel disabled:opacity-72"
              >
                <Button.Label className="text-sm text-ink">
                  {isSignUp ? "Login your account" : "Create account"}
                </Button.Label>
              </Button>
            </>
          )}
        </form.Subscribe>
      </View>
    </View>
  );
}
