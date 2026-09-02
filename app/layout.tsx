import type { Metadata, Viewport } from "next";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `Client Onboarding | ${site.company}`,
  description:
    "Digital Presence Package onboarding — tell us about your practice, your website and what you already have, and we'll get you online.",
  robots: { index: false, follow: false },
  openGraph: {
    title: `Client Onboarding | ${site.company}`,
    description:
      "Your Digital Presence Package starts with your website. Answer a few questions and we'll build, review and launch.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
