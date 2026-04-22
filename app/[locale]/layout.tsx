import { Inter, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/app/globals.css";
import { Footer } from "@/components/footer";
import { GoogleAnalyticsProvider } from "@/components/google-analytics";
import { Header } from "@/components/header";
import { RouteEngagementTracker } from "@/components/route-engagement-tracker";
import { ScrollTracker } from "@/components/scroll-tracker";
import { StructuredData } from "@/components/structured-data";
import {
  buildOrganizationJsonLd,
  buildPersonJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo";
import { isLocale, Locale, localeMetadata } from "@/lib/site";
import { notFound } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<unknown>;
}) {
  const resolvedParams = (await params) as { locale?: string };
  const localeValue = resolvedParams.locale ?? "";

  if (!isLocale(localeValue)) {
    notFound();
  }

  const locale: Locale = localeValue;

  return (
    <html lang={localeMetadata[locale].bcp47}>
      <body className={`${inter.variable} ${manrope.variable}`}>
        <StructuredData
          data={[
            buildPersonJsonLd(),
            buildOrganizationJsonLd(),
            buildWebsiteJsonLd(locale),
          ]}
        />
        <div className="app-shell">
          <Header locale={locale} />
          {children}
          <Footer locale={locale} />
        </div>
        <RouteEngagementTracker />
        <ScrollTracker />
        <GoogleAnalyticsProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
