import type { Metadata } from "next";

import { LegalDocuments } from "@/components/legal-documents";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy and Terms | Zius",
  description: "Read the Zius Privacy Policy and Terms and Conditions.",
};

export default function PrivacyPolicyAndTermsPage() {
  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-black">
      <SiteHeader />

      <div className="mx-auto w-[min(calc(100%-2rem),1080px)] sm:w-[min(calc(100%-2.5rem),1080px)]">
        <LegalDocuments />
      </div>

      <SiteFooter />
    </main>
  );
}
