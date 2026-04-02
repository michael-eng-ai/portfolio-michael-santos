"use client";

import { trackEvent } from "@/lib/analytics";
import { Locale } from "@/lib/site";
import { ResumeDocumentLocale } from "@/lib/resume";

type PrintResumeButtonProps = {
  locale: Locale;
  documentLocale: ResumeDocumentLocale;
  className?: string;
  children: React.ReactNode;
};

export function PrintResumeButton({
  locale,
  documentLocale,
  className,
  children,
}: PrintResumeButtonProps) {
  function handlePrint() {
    trackEvent("resume_print", {
      locale,
      document_locale: documentLocale,
    });

    window.print();
  }

  return (
    <button type="button" onClick={handlePrint} className={className}>
      {children}
    </button>
  );
}
