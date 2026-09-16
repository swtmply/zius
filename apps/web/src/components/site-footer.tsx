import Link from "next/link";

const legalLinks = [
  { href: "/privacy-policy-tos#privacy", label: "Privacy Policy" },
  { href: "/privacy-policy-tos#tos", label: "Terms and Conditions" },
  { href: "/privacy-policy-tos#account-deletion", label: "Account Deletion" },
  { href: "mailto:delosreyesjohnallen@gmail.com", label: "Contact Me" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[#e6e6e6] bg-[#f2f2f7]">
      <div className="mx-auto flex w-[min(calc(100%-2rem),1080px)] flex-col gap-10 pt-16 pb-10 sm:w-[min(calc(100%-2.5rem),1080px)]">
        <nav
          aria-label="Footer navigation"
          className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start"
        >
          {legalLinks.map(({ href, label }) => (
            <Link
              className="text-xs text-black/60 no-underline hover:text-black"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
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
  );
}
