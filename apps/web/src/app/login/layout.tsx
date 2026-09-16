import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Zius",
  description:
    "Sign in to the Zius web app with the same account as the mobile app, or create one in a minute.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
