import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
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
  title: {
    template: '%s | TradeQuote',
    default: 'TradeQuote - Professional Job Management for Australian Tradies'
  },
  description: "Professional job management software for Australian trade businesses. Track jobs, send quotes & invoices, get paid faster. Built by tradies for tradies.",
  keywords: ['trade software', 'job management', 'tradie software', 'Australian business software', 'quotes', 'invoices'],
  authors: [{ name: 'TradeQuote', url: 'https://tradequote.au' }],
  creator: 'TradeQuote',
  metadataBase: new URL('https://tradequote.au'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://tradequote.au',
    title: 'TradeQuote - Professional Job Management for Australian Tradies',
    description: 'Professional job management software built by tradies for tradies. Track jobs, send quotes, get paid faster.',
    siteName: 'TradeQuote',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-verification-code' // Replace with actual Google verification code
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
