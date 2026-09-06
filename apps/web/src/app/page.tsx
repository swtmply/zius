"use client";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

type ImagePlaceholderProps = {
  className: string;
  height: number;
  label: string;
  width: number;
};

const primaryButtonClasses =
  "inline-flex min-h-11.5 items-center justify-center rounded-2xl bg-black px-6 text-[15px] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 motion-reduce:transition-none";

const sectionHeadingClasses =
  "flex flex-col items-center gap-2.5 text-center [&>h2]:m-0 [&>h2]:text-[32px] [&>h2]:leading-[1.1] [&>h2]:font-bold [&>h2]:tracking-[-0.045em] max-sm:[&>h2]:text-[28px] [&>span]:text-xs [&>span]:font-semibold [&>span]:tracking-[0.06em] [&>span]:text-black/60 [&>span]:uppercase";

function ImagePlaceholder({
  className,
  height,
  label,
  width,
}: ImagePlaceholderProps) {
  return (
    <div
      aria-label={`${label} image placeholder, ${width} by ${height} pixels`}
      className={`flex shrink-0 flex-col items-center justify-center border border-dashed border-[#a8a8ad] bg-[#f7f7f8] text-center text-[#6b6b70] [background-image:linear-gradient(to_top_right,transparent_calc(50%_-_0.5px),#d2d2d7_50%,transparent_calc(50%_+_0.5px)),linear-gradient(to_bottom_right,transparent_calc(50%_-_0.5px),#d2d2d7_50%,transparent_calc(50%_+_0.5px))] [&>small]:bg-[#f7f7f8]/90 [&>small]:px-1.5 [&>small]:py-0.5 [&>small]:text-[11px] [&>span]:bg-[#f7f7f8]/90 [&>span]:px-1.5 [&>span]:py-0.5 [&>span]:text-[13px] [&>span]:font-semibold ${className}`}
      role="img"
    >
      <span>{label}</span>
      <small>
        {width} × {height} px
      </small>
    </div>
  );
}

const steps = [
  {
    title: "Create a Transaction",
    description:
      "Name the expense, add the amount, and choose how you want to split it.",
  },
  {
    title: "Add Participants",
    description:
      "Invite friends, roommates, or travel partners to the transaction.",
  },
  {
    title: "Settle Easily",
    description:
      "See every balance at a glance and settle up when everyone is ready.",
  },
] as const;

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <header className="mx-auto flex min-h-17 w-[min(calc(100%-2rem),1080px)] items-center justify-between sm:min-h-18.5 sm:w-[min(calc(100%-2.5rem),1080px)]">
        <a
          aria-label="Zius home"
          className="font-serif text-[15px] font-bold tracking-[-0.06em] text-black underline decoration-1 underline-offset-2"
          href="#top"
        >
          ZIUS
        </a>
        <nav aria-label="Main navigation" className="flex items-center gap-4">
          <a
            className="hidden text-sm font-medium text-black/60 no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 sm:block"
            href="#features"
          >
            Features
          </a>
          <a
            className="hidden text-sm font-medium text-black/60 no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 sm:block"
            href="/how-it-works"
          >
            How it works
          </a>
          <a
            className={`${primaryButtonClasses} min-h-10 px-4.5 text-[13px] sm:min-h-11.5 sm:px-6 sm:text-[15px]`}
            href="#waitlist"
          >
            Join the waitlist
          </a>
          <span className="text-sm text-muted-foreground">
            {healthCheck.isLoading
              ? "Checking..."
              : healthCheck.data
                ? "Connected"
                : "Disconnected"}
          </span>
        </nav>
      </header>

      <div
        className="mx-auto w-[min(calc(100%-2rem),1080px)] sm:w-[min(calc(100%-2.5rem),1080px)]"
        id="top"
      >
        <section className="grid min-h-196 grid-cols-[minmax(0,544px)_minmax(280px,383px)] items-center justify-between gap-14 max-md:min-h-0 max-md:grid-cols-1 max-md:justify-items-center max-md:py-18">
          <div className="flex flex-col items-start gap-7 max-md:items-center max-md:text-center">
            <h1 className="m-0 text-[clamp(44px,4.1vw,56px)] leading-[1.02] font-bold tracking-[-0.05em] max-sm:text-[42px]">
              Effortless expense splitting with everyone.
            </h1>
            <p className="m-0 max-w-130 text-[17px] leading-6 text-black/60 max-sm:text-base">
              Track who owes whom, create custom groups, and settle up
              instantly. No awkward conversations, just perfectly balanced math.
            </p>
            <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col">
              <a
                className={`${primaryButtonClasses} max-sm:w-full`}
                href="#waitlist"
              >
                Join the waitlist
              </a>
              <a
                className="inline-flex min-h-11.5 items-center justify-center rounded-2xl bg-[#ededed] px-6 text-[15px] font-semibold text-black no-underline transition hover:-translate-y-px hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 motion-reduce:transition-none max-sm:w-full"
                href="#features"
              >
                View Demo
              </a>
            </div>
          </div>
          <Image
            src="/images/dashboard.png"
            alt="Dashboard"
            width={383}
            height={784}
            loading="eager"
          />
        </section>

        <section
          className="px-10 pt-18 pb-24 max-sm:px-2 max-sm:py-18"
          id="features"
        >
          <div className={sectionHeadingClasses}>
            <span>Smart and simple</span>
            <h2>Everything you need to split &amp; settle.</h2>
          </div>

          <div className="mt-14 grid grid-cols-2 items-center justify-items-center gap-22 max-md:grid-cols-1 max-md:gap-10 max-md:text-center">
            <Image
              src="/images/transaction.png"
              alt="Dashboard"
              width={383}
              height={784}
              loading="eager"
            />
            <div className="max-w-90">
              <h3 className="m-0 mb-3 text-[32px] leading-[1.08] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                Perfect Bill Splitting
              </h3>
              <p className="m-0 text-sm leading-5 text-black/60">
                Split every item or calculate complete group totals down to the
                last centavo. Uneven splits are handled instantly.
              </p>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 items-center justify-items-center gap-22 max-md:grid-cols-1 max-md:gap-10 max-md:text-center">
            <div className="max-w-90 max-md:order-2">
              <h3 className="m-0 mb-3 text-[32px] leading-[1.08] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                Custom Friendship Groups
              </h3>
              <p className="m-0 text-sm leading-5 text-black/60">
                Split regular costs or one-time expenses across different
                circles. Keep every balance and participant organized in one
                place.
              </p>
            </div>

            <Image
              src="/images/create-transaction.png"
              alt="Dashboard"
              width={383}
              height={784}
              loading="eager"
            />
          </div>
        </section>

        <section
          aria-labelledby="reviews-heading"
          className="flex flex-col gap-10 rounded-[50px] bg-[#f2f2f7] px-10 py-20 max-sm:rounded-[32px] max-sm:px-6 max-sm:py-14"
        >
          <div className={sectionHeadingClasses}>
            <span>User reviews</span>
            <h2 id="reviews-heading">Loved by groups everywhere</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            <article className="flex min-h-44 flex-col justify-between gap-6 rounded-3xl bg-white p-6">
              <p className="m-0 text-sm leading-5 text-black/60">
                &quot;Zius saved our friendship during our Euro trip! It&apos;s
                so clean and doesn&apos;t get confusing with multi-currency
                conversions.&quot;
              </p>
              <div className="flex items-center gap-3">
                <ImagePlaceholder
                  className="size-10 overflow-hidden rounded-full [&>small]:hidden [&>span]:text-[8px]"
                  height={40}
                  label="Avatar"
                  width={40}
                />
                <div className="flex flex-col gap-0.5">
                  <strong className="text-sm">Marco B.</strong>
                  <span className="text-[11px] text-black/60">Traveler</span>
                </div>
              </div>
            </article>
            <article className="flex min-h-44 flex-col justify-between gap-6 rounded-3xl bg-white p-6">
              <p className="m-0 text-sm leading-5 text-black/60">
                &quot;Perfect for roommates. We track electricity, internet, and
                groceries. Instant notifications mean everyone stays on top of
                things.&quot;
              </p>
              <div className="flex items-center gap-3">
                <ImagePlaceholder
                  className="size-10 overflow-hidden rounded-full [&>small]:hidden [&>span]:text-[8px]"
                  height={40}
                  label="Avatar"
                  width={40}
                />
                <div className="flex flex-col gap-0.5">
                  <strong className="text-sm">Allen W.</strong>
                  <span className="text-[11px] text-black/60">Roommate</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section
          className="flex flex-col gap-12 px-10 py-24 max-sm:px-2 max-sm:py-18"
          id="how-it-works"
        >
          <div className={sectionHeadingClasses}>
            <span>The process</span>
            <h2>Get started in 3 steps</h2>
          </div>
          <ol className="m-0 grid list-none grid-cols-3 gap-6 p-0 max-sm:grid-cols-1">
            {steps.map((step, index) => (
              <li className="flex flex-col items-start gap-4" key={step.title}>
                <span className="grid size-10 place-items-center rounded-full bg-black text-lg font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="m-0 text-lg font-bold">{step.title}</h3>
                <p className="m-0 text-sm leading-5 text-black/60">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="flex flex-col items-center gap-6 rounded-[50px] bg-black px-10 py-13 text-center text-white max-sm:rounded-[32px] max-sm:px-6 max-sm:py-14"
          id="waitlist"
        >
          <h2 className="m-0 text-[32px] font-bold tracking-[-0.04em] max-sm:text-[28px]">
            Zius is your math genius friend
          </h2>
          <p className="m-0 max-w-180 text-base leading-6 text-[#f2f2f7]">
            No limits on transactions, groups, or friends. Enjoy complete access
            to direct bill-splitting tools.
          </p>
          <a
            className="inline-flex min-h-11.5 items-center rounded-2xl border border-[#e6e6e6] px-6 text-[15px] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 motion-reduce:transition-none"
            href="mailto:hello@zius.app?subject=Zius%20waitlist"
          >
            Join the waitlist
          </a>
        </section>
      </div>

      <footer className="mt-10 border-t border-[#e6e6e6] bg-[#f2f2f7]">
        <div className="mx-auto flex w-[min(calc(100%-2rem),1080px)] flex-col gap-10 pt-16 pb-10 sm:w-[min(calc(100%-2.5rem),1080px)]">
          <nav
            className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start"
            aria-label="Footer navigation"
          >
            <a
              className="text-xs text-black/60 no-underline"
              href="/privacy-policy-tos#privacy"
            >
              Privacy Policy
            </a>
            <a
              className="text-xs text-black/60 no-underline"
              href="/privacy-policy-tos#tos"
            >
              Terms and Conditions
            </a>
            <a
              className="text-xs text-black/60 no-underline"
              href="/privacy-policy-tos#account-deletion"
            >
              Account Deletion
            </a>
            <a
              className="text-xs text-black/60 no-underline"
              href="mailto:delosreyesjohnallen@gmail.com"
            >
              Contact Me
            </a>
          </nav>
          <div className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
            <span className="font-serif text-[15px] font-bold tracking-[-0.06em] text-black underline decoration-1 underline-offset-2">
              ZIUS
            </span>
            <span className="text-xs text-black/60">
              © 2026 John Allen Delos Reyes. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
