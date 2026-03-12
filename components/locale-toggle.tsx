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
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-xs">
      {locales.map((nextLocale) => {
        const href = `/${nextLocale}${rest ? `/${rest}` : ""}`;
        const isActive = nextLocale === locale;

        return (
          <Link
            key={nextLocale}
            href={href}
            className={`rounded-full px-3 py-1 transition ${
              isActive ? "bg-blue-400 text-slate-950" : "text-slate-300 hover:text-white"
            }`}
          >
            {nextLocale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
