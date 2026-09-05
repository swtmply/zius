import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "How it works | Zius",
  description: "See how Zius makes splitting shared expenses simple.",
};

const primaryButtonClasses =
  "inline-flex min-h-11.5 items-center justify-center rounded-2xl bg-black px-6 text-[15px] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 motion-reduce:transition-none";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <header className="mx-auto flex min-h-17 w-[min(calc(100%-2rem),1080px)] items-center justify-between sm:min-h-18.5 sm:w-[min(calc(100%-2.5rem),1080px)]">
        <a
          aria-label="Zius home"
          className="font-serif text-[15px] font-bold tracking-[-0.06em] text-black underline decoration-1 underline-offset-2"
          href="/"
        >
          ZIUS
        </a>
        <nav aria-label="Main navigation" className="flex items-center gap-4">
          <a
            className="hidden text-sm font-medium text-black/60 no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 sm:block"
            href="/#features"
          >
            Features
          </a>
          <a
            aria-current="page"
            className="hidden text-sm font-medium text-black no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 sm:block"
            href="/how-it-works"
          >
            How it works
          </a>
          <a
            className={`${primaryButtonClasses} min-h-10 px-4.5 text-[13px] sm:min-h-11.5 sm:px-6 sm:text-[15px]`}
            href="/#waitlist"
          >
            Join the waitlist
          </a>
        </nav>
      </header>

      <section className="mx-auto flex w-[min(calc(100%-2rem),1080px)] flex-col items-center px-10 pt-18 pb-24 max-sm:px-2 max-sm:py-18 sm:w-[min(calc(100%-2.5rem),1080px)]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="text-xs font-semibold tracking-[0.06em] text-black/60 uppercase">
            How it works
          </span>
          <h1 className="m-0 text-[32px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
            Easy as 1, 2, and 3...maybe 4?
          </h1>
        </div>

        <div className="flex flex-row items-center gap-2">
          <Image
            src="/images/how-it-works.png"
            alt="Dashboard"
            width={457}
            height={645}
            loading="eager"
          />

          <div className="flex flex-col justify-around self-stretch py-16">
            <div>
              <h3 className="m-0 text-[28px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                Enter Amount
              </h3>
              <p className="text-neutral-400">
                Enter the total amount of the bill.
              </p>
            </div>
            <div>
              <h3 className="m-0 text-[28px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                What is it about?
              </h3>
              <p className="text-neutral-400">
                Where, when, what is it the bill about.
              </p>
            </div>
            <div>
              <h3 className="m-0 text-[28px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                How should we split it?
              </h3>
              <p className="text-neutral-400">
                Select a split method. More coming soon!
              </p>
            </div>
            <div>
              <h3 className="m-0 text-[28px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                Who are we again?
              </h3>
              <p className="text-neutral-400">
                Yeah. Who we are again? Tap the name of the one who paid for the
                bill.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-10 border-t border-[#e6e6e6] bg-[#f2f2f7]">
        <div className="mx-auto flex w-[min(calc(100%-2rem),1080px)] flex-col gap-10 pt-16 pb-10 sm:w-[min(calc(100%-2.5rem),1080px)]">
          <nav
            aria-label="Footer navigation"
            className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start"
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
