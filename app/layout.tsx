import type { Metadata, Viewport } from "next";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `Advisor Onboarding | ${site.company}`,
  description:
    "Financial advisors: answer a few quick questions and get a custom marketing blueprint covering branding, print, web and follow-up — from One Stop Print & Digital Solutions.",
  robots: { index: false, follow: false },
  openGraph: {
    title: `Advisor Onboarding | ${site.company}`,
    description:
      "Tell us about your practice and your goals. We'll build your custom marketing blueprint in 3–5 business days.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1b33",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
