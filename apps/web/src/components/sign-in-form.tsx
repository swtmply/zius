import { useForm } from "@tanstack/react-form";
import { Button } from "@zius/ui/components/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import { AuthField } from "./auth-field";
import Loader from "./loader";
import { authCard, primaryButton } from "./marketing/styles";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            router.push("/dashboard");
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return (
      <div className={`${authCard} grid min-h-100 place-items-center`}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={authCard}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-[0.06em] text-black/60 uppercase">
          Welcome back
        </span>
        <h1 className="m-0 text-[28px] leading-[1.1] font-bold tracking-[-0.045em]">
          Sign in to Zius
        </h1>
        <p className="m-0 text-sm leading-5 text-black/60">
          Same account as the mobile app. Every group and expense is already waiting.
        </p>
      </div>

      <form
        className="mt-7 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <AuthField
              autoComplete="email"
              field={field}
              label="Email"
              placeholder="you@example.com"
              type="email"
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <AuthField
              autoComplete="current-password"
              field={field}
              label="Password"
              placeholder="At least 8 characters"
              type="password"
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              className={`${primaryButton} mt-1 w-full disabled:pointer-events-none disabled:opacity-40`}
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm text-black/60">
        Need an account?{" "}
        <button
          className="font-semibold text-black underline underline-offset-4 hover:opacity-70"
          onClick={onSwitchToSignUp}
          type="button"
        >
          Create one
        </button>
      </p>
    </div>
  );
}
