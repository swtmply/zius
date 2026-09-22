import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Zius",
  description:
    "Sign in to Zius with the same account as the app, or create one in a minute.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
