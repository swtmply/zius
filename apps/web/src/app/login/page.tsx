"use client";

import { useState } from "react";

import { sectionShell } from "@/components/marketing/styles";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div aria-hidden className="aurora pointer-events-none absolute inset-0 -z-10" />
        <div
          className={`${sectionShell} flex flex-col items-center gap-6 py-20 max-sm:py-14`}
        >
          <div className="w-full max-w-100">
            {showSignIn ? (
              <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
            ) : (
              <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
