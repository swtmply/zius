import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { authCard, primaryButton, sectionShell } from "@/components/marketing/styles";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const { email } = await searchParams;
  const address = Array.isArray(email) ? email[0] : email;

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div aria-hidden className="aurora pointer-events-none absolute inset-0 -z-10" />
        <div className={`${sectionShell} flex flex-col items-center gap-6 py-20 max-sm:py-14`}>
          <div className={`${authCard} flex w-full max-w-100 flex-col gap-5`}>
            <div className="flex flex-col gap-2">
              <h1 className="m-0 text-[28px] leading-[1.1] font-bold tracking-[-0.045em]">
                Check your email
              </h1>
              <p className="m-0 text-sm leading-5 text-black/60">
                We sent a verification link to {address || "your email address"}. Open it to
                verify your address and finish creating your account.
              </p>
            </div>

            <Link className={primaryButton} href="/login">
              Back to sign in
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
