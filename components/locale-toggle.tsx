"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Locale, locales } from "@/lib/site";

type LocaleToggleProps = {
  locale: Locale;
};

export function LocaleToggle({ locale }: LocaleToggleProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");

  return (
    <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs lg:gap-2 lg:p-1">
      {locales.map((nextLocale) => {
        const href = `/${nextLocale}${rest ? `/${rest}` : ""}`;
        const isActive = nextLocale === locale;

        return (
          <Link
            key={nextLocale}
            href={href}
            className={`rounded-full px-2.5 py-1 text-[11px] transition lg:px-3.5 lg:py-1.5 lg:text-xs ${
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
