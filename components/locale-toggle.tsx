"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { trackEvent } from "@/lib/analytics";
import { Locale, locales } from "@/lib/site";

type LocaleToggleProps = {
  locale: Locale;
};

export function LocaleToggle({ locale }: LocaleToggleProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1 text-xs">
      {locales.map((nextLocale) => {
        const href = `/${nextLocale}${rest ? `/${rest}` : ""}`;
        const isActive = nextLocale === locale;

        return (
          <Link
            key={nextLocale}
            href={href}
            onClick={() => {
              document.cookie = `preferred_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
              trackEvent("locale_switch", {
                from_locale: locale,
                to_locale: nextLocale,
                page: pathname,
              });
            }}
            className={`rounded-full px-3.5 py-1.5 transition ${
              isActive ? "bg-[var(--primary)] text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {nextLocale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
