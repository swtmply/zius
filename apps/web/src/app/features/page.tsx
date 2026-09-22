import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { mobileFeatures, sharedFeatures } from "@/components/marketing/features";
import { EarlyAccessButton } from "@/components/marketing/early-access-dialog";
import {
  primaryButton,
  secondaryButton,
  sectionHeading,
  sectionShell,
} from "@/components/marketing/styles";

export const metadata: Metadata = {
  title: "Features | Zius",
  description:
    "What Zius does at the table: receipt scanning, four ways to split, and centavo-exact balances for every group.",
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <SiteHeader />

      <section
        className={`${sectionShell} flex flex-col items-center gap-6 py-20 text-center max-sm:py-14`}
      >
        <div className={sectionHeading}>
          <span>Features</span>
          <h2>A phone at the table is all it takes.</h2>
          <p>
            Zius captures the bill where it happens and keeps the balances straight long after
            everyone has gone home.
          </p>
        </div>
        <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col">
          <EarlyAccessButton className={`${primaryButton} max-sm:w-full`}>
            Get the app
          </EarlyAccessButton>
          <Link className={`${secondaryButton} max-sm:w-full`} href="/how-it-works">
            See it screen by screen
          </Link>
        </div>
      </section>

      <section className="bg-black py-24 text-white max-sm:py-16">
        <div
          className={`${sectionShell} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-14 max-md:grid-cols-1`}
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold tracking-[0.06em] text-white/50 uppercase">
                At the table
              </span>
              <h2 className="m-0 text-[32px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                The camera does the typing
              </h2>
            </div>
            <ul className="m-0 flex list-none flex-col gap-6 p-0">
              {mobileFeatures.map((feature) => (
                <li
                  className="reveal flex flex-col gap-2 border-l border-white/15 pl-5"
                  key={feature.title}
                >
                  <h3 className="m-0 text-xl font-bold tracking-[-0.03em]">{feature.title}</h3>
                  <p className="m-0 text-sm leading-5 text-white/60">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <Image
            alt="Receipt text recognized on-device in the Zius mobile app"
            className="reveal h-auto w-80 max-w-full justify-self-center"
            height={902}
            src="/images/features/receipt-preview.png"
            width={430}
          />
        </div>
      </section>

      <section className={`${sectionShell} flex flex-col gap-12 py-24 max-sm:py-16`}>
        <div className={sectionHeading}>
          <span>The splitting engine</span>
          <h2>Math that always adds back up</h2>
          <p>Same expenses, same groups, same centavo-exact totals, every time.</p>
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
        className={`${sectionShell} grid grid-cols-[auto_minmax(0,1fr)] items-center gap-14 pb-24 max-md:grid-cols-1 max-sm:pb-16`}
      >
        <Image
          alt="A group's settled and unsettled expenses in Zius"
          className="reveal h-auto w-80 max-w-full justify-self-center"
          height={902}
          src="/images/features/group-details-expenses.png"
          width={430}
        />
        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold tracking-[0.06em] text-black/60 uppercase">
            After the dinner
          </span>
          <h2 className="m-0 text-[32px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
            Every group keeps its own two piles
          </h2>
          <p className="m-0 text-[15px] leading-6 text-black/60">
            Settled and unsettled, side by side. Filter a month of dinners, see who still owes whom,
            and cancel what should not have been there without losing the record.
          </p>
        </div>
      </section>

      <section className={sectionShell}>
        <div className="flex flex-col items-center gap-6 rounded-[50px] bg-black px-10 py-16 text-center text-white max-sm:rounded-[32px] max-sm:px-6 max-sm:py-14">
          <h2 className="m-0 text-[32px] font-bold tracking-[-0.04em] max-sm:text-[28px]">
            Start where the receipts are
          </h2>
          <p className="m-0 max-w-160 text-base leading-6 text-[#f2f2f7]">
            Zius is in early access on Android. Send me a message and I will get you a build.
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
