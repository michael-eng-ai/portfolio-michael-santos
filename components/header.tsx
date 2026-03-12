import Link from "next/link";

import { Locale, copy, localePath, siteConfig } from "@/lib/site";
import { LocaleToggle } from "@/components/locale-toggle";
import { MobileNav } from "@/components/mobile-nav";

type HeaderProps = {
  locale: Locale;
};

export function Header({ locale }: HeaderProps) {
  const navItems = [
    { href: localePath(locale, "/articles"), label: copy(locale, "Insights", "Insights") },
    { href: localePath(locale, "/news"), label: copy(locale, "News", "Noticias") },
    { href: localePath(locale, "/projects"), label: copy(locale, "Business Cases", "Casos") },
    { href: localePath(locale, "/newsletter"), label: copy(locale, "Newsletter", "Newsletter") },
    { href: localePath(locale, "/contact"), label: copy(locale, "Contact", "Contato") }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(11,20,31,0.58)] backdrop-blur-xl">
      <div className="container-shell flex items-center justify-between gap-4 py-4">
        <Link href={localePath(locale)} className="flex min-w-0 flex-col">
          <span className="brand-heading-kicker hidden text-slate-400 sm:block">
            {siteConfig.role}
          </span>
          <span className="display-copy truncate text-base font-semibold text-white sm:text-lg">{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="brand-link transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleToggle locale={locale} />
          <Link
            href={localePath(locale, "/resume")}
            className="brand-button-primary hidden rounded-full px-4 py-2 text-sm font-medium transition hover:brightness-105 sm:inline-flex"
          >
            {copy(locale, "Resume", "Curriculo")}
          </Link>
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  );
}
