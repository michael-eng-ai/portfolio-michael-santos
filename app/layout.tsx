import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";

import "@/app/globals.css";
import { GoogleAnalyticsProvider } from "@/components/google-analytics";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, buildPersonJsonLd, buildWebsiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.title,
  manifest: "/manifest.webmanifest",
  referrer: "origin-when-cross-origin",
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name, url: siteConfig.linkedinUrl }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: "/icon",
    apple: "/icon",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: absoluteUrl(siteConfig.defaultSocialImage),
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.defaultSocialImage)],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c1827",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <StructuredData data={[buildPersonJsonLd(), buildWebsiteJsonLd("en")]} />
        <div className="app-shell">{children}</div>
        <GoogleAnalyticsProvider />
      </body>
    </html>
  );
}
