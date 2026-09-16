import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  comparison,
  mobileFeatures,
  sharedFeatures,
  webFeatures,
} from "@/components/marketing/features";
import {
  primaryButton,
  secondaryButton,
  sectionHeading,
  sectionShell,
  waitlistHref,
} from "@/components/marketing/styles";

export const metadata: Metadata = {
  title: "Features | Zius",
  description:
    "What Zius does on mobile, what it does on the web, and the receipt scanning that only the phone can do.",
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
          <h2>Phone at the table. Browser the morning after.</h2>
          <p>
            Zius is one ledger with two front doors. The mobile app is where expenses get captured;
            the web app is where they get reviewed.
          </p>
        </div>
        <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col">
          <a className={`${primaryButton} max-sm:w-full`} href={waitlistHref}>
            Get the mobile app
          </a>
          <Link className={`${secondaryButton} max-sm:w-full`} href="/login">
            Open the web app
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
                Mobile only
              </span>
              <h2 className="m-0 text-[32px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
                Things a browser cannot do
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
          <span>On every screen</span>
          <h2>The splitting engine, everywhere</h2>
          <p>Same expenses, same groups, same math, whichever app you happen to have open.</p>
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
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold tracking-[0.06em] text-black/60 uppercase">
              On the web
            </span>
            <h2 className="m-0 text-[32px] leading-[1.1] font-bold tracking-[-0.045em] max-sm:text-[28px]">
              Room to see the whole picture
            </h2>
          </div>
          <ul className="m-0 flex list-none flex-col gap-6 p-0">
            {webFeatures.map((feature) => (
              <li
                className="reveal flex flex-col gap-2 border-l border-black/10 pl-5"
                key={feature.title}
              >
                <h3 className="m-0 text-xl font-bold tracking-[-0.03em]">{feature.title}</h3>
                <p className="m-0 text-sm leading-5 text-black/60">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${sectionShell} flex flex-col gap-8 pb-24 max-sm:pb-16`}>
        <div className={sectionHeading}>
          <span>Side by side</span>
          <h2>Where each app wins</h2>
        </div>
        <div className="overflow-hidden rounded-3xl border border-[#e6e6e6]">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Feature availability on mobile and web</caption>
            <thead className="bg-[#f2f2f7] text-xs tracking-[0.04em] text-black/60 uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold" scope="col">
                  Feature
                </th>
                <th className="w-24 px-5 py-3 text-center font-semibold" scope="col">
                  Mobile
                </th>
                <th className="w-24 px-5 py-3 text-center font-semibold" scope="col">
                  Web
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr className="border-t border-[#e6e6e6]" key={row.feature}>
                  <th className="px-5 py-3.5 font-normal" scope="row">
                    {row.feature}
                  </th>
                  <td className="px-5 py-3.5 text-center">
                    <span className={row.mobile ? "font-semibold" : "text-black/30"}>
                      {row.mobile ? "Yes" : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={row.web ? "font-semibold" : "text-black/30"}>
                      {row.web ? "Yes" : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={sectionShell}>
        <div className="flex flex-col items-center gap-6 rounded-[50px] bg-black px-10 py-16 text-center text-white max-sm:rounded-[32px] max-sm:px-6 max-sm:py-14">
          <h2 className="m-0 text-[32px] font-bold tracking-[-0.04em] max-sm:text-[28px]">
            Start where the receipts are
          </h2>
          <p className="m-0 max-w-160 text-base leading-6 text-[#f2f2f7]">
            Get on the early access list for iOS and Android. The web app is already open if you
            want to look around first.
          </p>
          <a
            className="inline-flex min-h-11.5 items-center justify-center rounded-2xl bg-white px-6 text-[15px] font-semibold text-black no-underline transition hover:-translate-y-px hover:opacity-85 motion-reduce:transition-none"
            href={waitlistHref}
          >
            Get early access
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
