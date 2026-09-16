"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-17 w-[min(calc(100%-2rem),1080px)] items-center justify-between gap-4 sm:min-h-18.5 sm:w-[min(calc(100%-2.5rem),1080px)]">
        <Link
          aria-label="Zius home"
          className="font-serif text-[15px] font-bold tracking-[-0.06em] text-black underline decoration-1 underline-offset-2"
          href="/"
        >
          ZIUS
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-4">
          {links.map(({ href, label }) => (
            <Link
              aria-current={pathname === href ? "page" : undefined}
              className={`hidden text-sm font-medium no-underline transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 sm:block ${
                pathname === href ? "text-black" : "text-black/60"
              }`}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
          <Link
            className="hidden text-sm font-medium text-black/60 no-underline transition-colors hover:text-black sm:block"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-black px-4.5 text-[13px] font-semibold text-white no-underline transition hover:-translate-y-px hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 motion-reduce:transition-none sm:min-h-11.5 sm:px-6 sm:text-[15px]"
            href="/#get-the-app"
          >
            Get the app
          </Link>
        </nav>
      </div>
    </header>
  );
}
