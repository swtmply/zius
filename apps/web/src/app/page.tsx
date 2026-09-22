import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EarlyAccessButton } from "@/components/marketing/early-access-dialog";
import {
  primaryButton,
  secondaryButton,
  sectionHeading,
  sectionShell,
} from "@/components/marketing/styles";
import { mobileFeatures, sharedFeatures } from "@/components/marketing/features";

export const metadata: Metadata = {
  title: "Zius | Split the bill before the plates are cleared",
  description:
    "Zius is a mobile expense splitter for Android. Scan the receipt, tap who is in, and settle to the last centavo.",
};

const steps = [
  {
    title: "Scan or type the bill",
    description:
      "Snap the receipt, or type the amount. Name it so future-you remembers.",
  },
  {
    title: "Tap who is in",
    description:
      "Pick participants from a group or add a guest. Choose how the amount gets divided.",
  },
  {
    title: "Settle up",
    description:
      "Everyone sees the same balance, so nobody has to send the awkward follow-up message.",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <SiteHeader />

      <section className="relative overflow-hidden" id="top">
        <div aria-hidden className="aurora pointer-events-none absolute inset-0 -z-10" />
        <div
          className={`${sectionShell} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-14 py-20 max-md:grid-cols-1 max-md:justify-items-center max-md:py-14`}
        >
          <div className="flex max-w-140 flex-col items-start gap-6 max-md:items-center max-md:text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-black/70 uppercase">
              <span className="size-1.5 rounded-full bg-[#34c759]" />
              Android · early access
            </span>
            <h1 className="m-0 text-[clamp(44px,4.4vw,60px)] leading-[1.02] font-bold tracking-[-0.05em] max-sm:text-[40px]">
              Split the bill before the plates are cleared.
            </h1>
            <p className="m-0 text-[17px] leading-6 text-black/60">
              Zius is built for your phone. Scan the receipt at the table, tap who is in, and
              everyone walks away knowing exactly what they owe, down to the last centavo.
            </p>
            <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col">
              <a className={`${primaryButton} max-sm:w-full`} href="#get-the-app">
                Get the app
              </a>
              <Link className={`${secondaryButton} max-sm:w-full`} href="/features">
                See what it does
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Image
              alt="The Zius mobile dashboard showing what you owe and what you are owed"
              className="h-auto w-80 max-w-full"
              height={902}
              priority
              src="/images/features/mobile-dashboard.png"
              width={430}
            />
            <p className="m-0 max-w-70 text-center text-xs text-black/50">
              Every balance in the group, on one screen. Scan a receipt and it lands here.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-black py-24 text-white max-sm:py-16" id="mobile">
        <div className={`${sectionShell} flex flex-col gap-12`}>
          <div className="flex max-w-150 flex-col gap-2.5">
            <span className="text-xs font-semibold tracking-[0.06em] text-white/50 uppercase">
              Start on mobile
            </span>
            <h2 className="m-0 text-[32px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
              The receipt is in your hand. So is Zius.
            </h2>
            <p className="m-0 text-[15px] leading-6 text-white/60">
              Bills happen away from a desk. The app does the things that only happen at the table,
              starting with the camera.
            </p>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-14 max-md:grid-cols-1 max-md:gap-10">
            <Image
              alt="Scanning a receipt in the Zius mobile app"
              className="reveal h-auto w-80 max-w-full justify-self-center"
              height={902}
              loading="eager"
              src="/images/features/receipt-camera.png"
              width={430}
            />
            <ul className="m-0 flex list-none flex-col gap-6 p-0">
              {mobileFeatures.map((feature) => (
                <li
                  className="reveal flex flex-col gap-2 border-l border-white/15 pl-5"
                  key={feature.title}
                >
                  <span className="text-[10px] font-semibold tracking-[0.08em] text-[#ff9500] uppercase">
                    {feature.tag}
                  </span>
                  <h3 className="m-0 text-xl font-bold tracking-[-0.03em]">{feature.title}</h3>
                  <p className="m-0 text-sm leading-5 text-white/60">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-stretch">
            <EarlyAccessButton className="inline-flex min-h-11.5 items-center justify-center rounded-2xl bg-white px-6 text-[15px] font-semibold text-black transition hover:-translate-y-px hover:opacity-85 motion-reduce:transition-none">
              Get early access
            </EarlyAccessButton>
            <Link
              className="inline-flex min-h-11.5 items-center justify-center rounded-2xl border border-white/20 px-6 text-[15px] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-85 motion-reduce:transition-none"
              href="/how-it-works"
            >
              Watch how a split works
            </Link>
          </div>
        </div>
      </section>

      <section className={`${sectionShell} flex flex-col gap-12 py-24 max-sm:py-16`} id="features">
        <div className={sectionHeading}>
          <span>In the app</span>
          <h2>Everything you need to split and settle.</h2>
          <p>
            One ledger, one set of balances, from the receipt at the table to the settle-up the
            morning after.
          </p>
        </div>
        <ul className="m-0 grid list-none grid-cols-3 gap-6 p-0 max-md:grid-cols-2 max-sm:grid-cols-1">
          {sharedFeatures.map((feature) => (
            <li
              className="reveal flex flex-col gap-2 rounded-3xl bg-[#f2f2f7] p-6 transition hover:-translate-y-1 motion-reduce:transition-none"
              key={feature.title}
            >
              <h3 className="m-0 text-lg font-bold tracking-[-0.02em]">{feature.title}</h3>
              <p className="m-0 text-sm leading-5 text-black/60">{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`${sectionShell} flex flex-col gap-12 pb-24 max-sm:pb-16`}
        id="how-it-works"
      >
        <div className={sectionHeading}>
          <span>The process</span>
          <h2>Get started in 3 steps</h2>
        </div>
        <ol className="m-0 grid list-none grid-cols-3 gap-6 p-0 max-sm:grid-cols-1">
          {steps.map((step, index) => (
            <li className="reveal flex flex-col items-start gap-4" key={step.title}>
              <span className="grid size-10 place-items-center rounded-full bg-black text-lg font-bold text-white">
                {index + 1}
              </span>
              <h3 className="m-0 text-lg font-bold">{step.title}</h3>
              <p className="m-0 text-sm leading-5 text-black/60">{step.description}</p>
            </li>
          ))}
        </ol>
        <Link
          className="text-sm font-semibold text-black underline underline-offset-4"
          href="/how-it-works"
        >
          See it screen by screen
        </Link>
      </section>

      <section className={sectionShell} id="get-the-app">
        <div className="flex flex-col items-center gap-6 rounded-[50px] bg-black px-10 py-16 text-center text-white max-sm:rounded-[32px] max-sm:px-6 max-sm:py-14">
          <h2 className="m-0 text-[32px] font-bold tracking-[-0.04em] max-sm:text-[28px]">
            Zius is your math genius friend
          </h2>
          <p className="m-0 max-w-160 text-base leading-6 text-[#f2f2f7]">
            The app is in early access on Android. Send me a message and I will send your build, no
            limits on expenses, groups, or people.
          </p>
          <EarlyAccessButton className="inline-flex min-h-11.5 items-center justify-center rounded-2xl bg-white px-6 text-[15px] font-semibold text-black transition hover:-translate-y-px hover:opacity-85 motion-reduce:transition-none max-sm:w-full">
            Get early access
          </EarlyAccessButton>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
