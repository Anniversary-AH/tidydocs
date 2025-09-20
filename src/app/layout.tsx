import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TidyDocs – Make messy files client-ready in seconds",
  description:
    "Free document conversion tools: CSV to PDF, PDF to Word, Excel to charts. Clean and standardize messy files instantly.",
  metadataBase:
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "TidyDocs – Make messy files client-ready in seconds",
    description:
      "Clean and standardize messy documents fast. TidyDocs turns rough files into client-ready outputs in seconds.",
    siteName: "TidyDocs",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "TidyDocs OpenGraph image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TidyDocs – Make messy files client-ready in seconds",
    description:
      "Clean and standardize messy documents fast. TidyDocs turns rough files into client-ready outputs in seconds.",
    images: ["/og.svg"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FFF9F3] text-neutral-900 font-sans`}
      >
        <header className="w-full border-b border-neutral-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between" role="navigation" aria-label="Primary">
            <Link href="/" className="group inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 rounded-md">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-neutral-900 text-white" aria-hidden>
                <span className="text-[10px] leading-none font-semibold">TD</span>
              </span>
              <span className="text-sm sm:text-base font-semibold tracking-tight">TidyDocs by Amber-Field</span>
            </Link>
            <nav aria-label="Utility" className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm text-neutral-700 hover:text-neutral-900 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 rounded-md px-1">
                Privacy
              </Link>
              <Link href="/contact" className="text-sm text-neutral-700 hover:text-neutral-900 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 rounded-md px-1">
                Contact
              </Link>
            </nav>
          </div>
        </header>
        <main id="main" role="main" className="min-h-[calc(100dvh-112px)]">
          {children}
        </main>
        <footer role="contentinfo" className="w-full border-t border-neutral-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm text-neutral-700 flex flex-wrap items-center justify-between gap-3">
            <span>© Amber-Field Tools</span>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-neutral-900 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 rounded-md px-1">Privacy</Link>
              <span aria-hidden>•</span>
              <Link href="/contact" className="hover:text-neutral-900 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 rounded-md px-1">Contact</Link>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
