"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/todos", label: "Todos" },
  ] as const;

  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-sm font-bold tracking-[-0.06em]">
          ZIUS
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-xs sm:flex">
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                href={to}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
