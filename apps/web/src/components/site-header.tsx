"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@zius/ui/components/sheet";

const links = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        <div className="flex items-center gap-3 sm:gap-4">
          <nav aria-label="Main navigation" className="hidden items-center gap-4 sm:flex">
            {links.map(({ href, label }) => (
              <Link
                aria-current={pathname === href ? "page" : undefined}
                className={`text-sm font-medium no-underline transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 ${
                  pathname === href ? "text-black" : "text-black/60"
                }`}
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-black px-4.5 text-[13px] font-semibold whitespace-nowrap text-white no-underline transition hover:-translate-y-px hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-indigo-500 motion-reduce:transition-none sm:min-h-11.5 sm:px-6 sm:text-[15px]"
            href="/#get-the-app"
          >
            Get the app
          </Link>

          <Sheet onOpenChange={setIsMenuOpen} open={isMenuOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-2xl border border-black/10 text-black sm:hidden"
            >
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            </SheetTrigger>
            <SheetContent className="bg-white text-black" side="right">
              <SheetHeader>
                <SheetTitle className="font-serif text-[15px] font-bold tracking-[-0.06em] text-black">
                  ZIUS
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Main navigation" className="flex flex-col p-4 pt-2">
                {links.map(({ href, label }) => (
                  <Link
                    aria-current={pathname === href ? "page" : undefined}
                    className={`border-b border-black/5 py-3.5 text-base font-semibold no-underline ${
                      pathname === href ? "text-black" : "text-black/60"
                    }`}
                    href={href}
                    key={href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
