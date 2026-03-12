import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { notFound } from "next/navigation";

import { isLocale, Locale } from "@/lib/site";

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
    <>
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
    </>
  );
}
