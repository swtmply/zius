"use client";

import { Button } from "@zius/ui/components/button";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export function GoogleSignIn() {
  const [isPending, setIsPending] = useState(false);

  async function signIn() {
    setIsPending(true);

    try {
      await authClient.signIn.social(
        { provider: "google", callbackURL: "/dashboard" },
        {
          onError: (error) => {
            toast.error(error.error.message || "Unable to sign in with Google");
            setIsPending(false);
          },
        },
      );
    } catch {
      toast.error("Unable to sign in with Google");
      setIsPending(false);
    }
  }

  return (
    <div className="mt-7 flex flex-col gap-4">
      <Button
        className="h-11.5 w-full rounded-2xl border border-black/10 bg-white text-[15px] font-semibold text-black hover:bg-black/4"
        disabled={isPending}
        onClick={() => void signIn()}
        type="button"
        variant="outline"
      >
        <Image alt="" aria-hidden height={18} src="/images/google-icon.png" width={18} />
        {isPending ? "Opening Google..." : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-xs text-black/50">or continue with email</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>
    </div>
  );
}
