import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocuments } from "@/components/legal-documents";

export const metadata: Metadata = {
  title: "Privacy Policy and Terms | Zius",
  description: "Read the Zius Privacy Policy and Terms and Conditions.",
};

export default function PrivacyPolicyAndTermsPage() {
  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <header className="mx-auto flex min-h-18.5 w-[min(calc(100%-2rem),1080px)] items-center justify-between sm:w-[min(calc(100%-2.5rem),1080px)]">
        <Link
          aria-label="Zius home"
          className="font-serif text-[15px] font-bold tracking-[-0.06em] text-black underline decoration-1 underline-offset-2"
          href="/"
        >
          ZIUS
        </Link>

        <nav aria-label="Legal document navigation" className="flex items-center gap-4">
          <a className="text-sm font-medium text-black/60 no-underline" href="#privacy">
            Privacy
          </a>
          <a className="text-sm font-medium text-black/60 no-underline" href="#tos">
            Terms
          </a>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-black px-4.5 text-[13px] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 motion-reduce:transition-none"
            href="/"
          >
            Back to home
          </Link>
        </nav>
      </header>

      <div className="mx-auto w-[min(calc(100%-2rem),1080px)] sm:w-[min(calc(100%-2.5rem),1080px)]">
        <LegalDocuments />
      </div>

      <footer className="border-t border-[#e6e6e6] bg-[#f2f2f7]">
        <div className="mx-auto flex w-[min(calc(100%-2rem),1080px)] items-center justify-between gap-6 py-10 text-xs text-black/60 sm:w-[min(calc(100%-2.5rem),1080px)] max-sm:flex-col max-sm:items-start">
          <span className="font-serif text-[15px] font-bold tracking-[-0.06em] text-black underline decoration-1 underline-offset-2">
            ZIUS
          </span>
          <span>© 2026 John Allen Delos Reyes. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
