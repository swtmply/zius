import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { mobileScreens } from "@/components/marketing/features";
import {
  primaryButton,
  secondaryButton,
  sectionHeading,
  sectionShell,
  waitlistHref,
} from "@/components/marketing/styles";

export const metadata: Metadata = {
  title: "How it works | Zius",
  description:
    "Every screen of the Zius mobile app, from scanning the receipt to settling the group balance.",
};

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="marquee-track m-0 flex shrink-0 list-none items-start gap-6 p-0 pr-6"
    >
      {mobileScreens.map((screen) => (
        <li className="flex w-55 flex-col gap-3" key={screen.src}>
          <Image
            alt={`${screen.title} screen in the Zius mobile app`}
            className="h-auto w-full"
            height={902}
            loading={hidden ? "lazy" : "eager"}
            src={`/images/features/${screen.src}.png`}
            width={430}
          />
          <div className="flex flex-col gap-1 px-1">
            <h3 className="m-0 text-base font-bold tracking-[-0.02em]">{screen.title}</h3>
            <p className="m-0 text-xs leading-4 text-black/60">{screen.caption}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <SiteHeader />

      <section className={`${sectionShell} flex flex-col items-center gap-6 py-20 max-sm:py-14`}>
        <div className={sectionHeading}>
          <span>How it works</span>
          <h2>Every screen, end to end.</h2>
          <p>
            Scan the receipt, pick how it splits, tap who was there. Here is the whole mobile app
            scrolling past. Hover to stop on one.
          </p>
        </div>
      </section>

      <section aria-label="Zius mobile app screens" className="marquee flex overflow-hidden pb-20">
        <Track />
        <Track hidden />
      </section>

      <section className={`${sectionShell} flex flex-col items-center gap-6 pb-24 max-sm:pb-16`}>
        <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col">
          <a className={`${primaryButton} max-sm:w-full`} href={waitlistHref}>
            Get the mobile app
          </a>
          <Link className={`${secondaryButton} max-sm:w-full`} href="/features">
            Compare mobile and web
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
