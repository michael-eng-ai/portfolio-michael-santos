import Link from "next/link";

import { Locale, copy, localePath, siteConfig } from "@/lib/site";
import { LocaleToggle } from "@/components/locale-toggle";
import { MobileNav } from "@/components/mobile-nav";

type HeaderProps = {
  locale: Locale;
};

export function Header({ locale }: HeaderProps) {
  const navItems = [
    { href: localePath(locale, "/projects"), label: copy(locale, "Success Stories", "Casos") },
    { href: localePath(locale, "/articles"), label: copy(locale, "Insights", "Insights") },
    { href: localePath(locale, "/news"), label: copy(locale, "News", "Noticias") },
    { href: localePath(locale, "/contact"), label: copy(locale, "Contact", "Contato") },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href={localePath(locale)} className="text-xl font-black uppercase tracking-tighter text-gray-900">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-[var(--primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LocaleToggle locale={locale} />
          <Link
            href={localePath(locale, "/resume")}
            className="brand-button-primary hidden px-6 py-2.5 text-sm font-bold tracking-tight sm:inline-flex"
          >
            {copy(locale, "Resume", "Curriculo")}
          </Link>
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  );
}
