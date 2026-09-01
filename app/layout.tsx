import type { Metadata, Viewport } from "next";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `Client Onboarding | ${site.company}`,
  description:
    "Onboarding questionnaire for One Stop Print & Digital Solutions clients — tell us about your practice, the services you need and your goals so we can get started.",
  robots: { index: false, follow: false },
  openGraph: {
    title: `Client Onboarding | ${site.company}`,
    description:
      "Tell us about your practice, the services you need and your goals so we can get your onboarding started.",
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
