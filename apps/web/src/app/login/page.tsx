"use client";

import { useState } from "react";

import { sectionShell } from "@/components/marketing/styles";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const points = [
  {
    title: "The same ledger as your phone",
    description:
      "Everything your group scanned at the table is already here, down to the last centavo.",
  },
  {
    title: "A wider view for the reckoning",
    description: "Filter a month of dinners and review who owes whom with a keyboard, not a thumb.",
  },
  {
    title: "Nothing to set up",
    description: "Sign in and your groups, expenses, and balances load as they were.",
  },
] as const;

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div aria-hidden className="aurora pointer-events-none absolute inset-0 -z-10" />
        <div
          className={`${sectionShell} grid grid-cols-[minmax(0,1fr)_minmax(0,25rem)] items-center gap-16 py-20 max-md:grid-cols-1 max-md:justify-items-center max-md:gap-10 max-md:py-14`}
        >
          <div className="flex max-w-125 flex-col gap-6 max-md:hidden">
            <span className="text-xs font-semibold tracking-[0.06em] text-black/60 uppercase">
              The web app
            </span>
            <h2 className="m-0 text-[clamp(34px,3.4vw,44px)] leading-[1.05] font-bold tracking-[-0.05em]">
              Pick up where the table left off.
            </h2>
            <ul className="m-0 flex list-none flex-col gap-5 p-0">
              {points.map((point) => (
                <li className="flex flex-col gap-1 border-l border-black/10 pl-5" key={point.title}>
                  <h3 className="m-0 text-base font-bold tracking-[-0.02em]">{point.title}</h3>
                  <p className="m-0 text-sm leading-5 text-black/60">{point.description}</p>
                </li>
              ))}
            </ul>
          </div>

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
