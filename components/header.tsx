import { Locale, copy, localePath, siteConfig } from "@/lib/site";
import { LocaleToggle } from "@/components/locale-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { TrackedLink } from "@/components/tracked-link";

type HeaderProps = {
  locale: Locale;
};

export function Header({ locale }: HeaderProps) {
  const navItems = [
    { href: localePath(locale, "/projects"), label: copy(locale, "Success Stories", "Casos"), target: "projects" },
    { href: localePath(locale, "/articles"), label: copy(locale, "Insights", "Insights"), target: "articles" },
    { href: localePath(locale, "/news"), label: copy(locale, "News", "Noticias"), target: "news" },
    { href: localePath(locale, "/radar"), label: copy(locale, "Radar", "Radar"), target: "radar" },
    { href: localePath(locale, "/contact"), label: copy(locale, "Contact", "Contato"), target: "contact" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <TrackedLink
          href={localePath(locale)}
          eventName="navigation_click"
          eventParams={{ location: "header", target: "home", locale }}
          className="text-xl font-black uppercase tracking-tighter text-gray-900"
        >
          {siteConfig.name}
        </TrackedLink>

        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <TrackedLink
              key={item.href}
              href={item.href}
              eventName="navigation_click"
              eventParams={{ location: "header", target: item.target, locale }}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-[var(--primary)]"
            >
              {item.label}
            </TrackedLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LocaleToggle locale={locale} />
          <TrackedLink
            href={localePath(locale, "/newsletter")}
            eventName="navigation_click"
            eventParams={{ location: "header", target: "newsletter", locale }}
            className="brand-button-primary hidden px-6 py-2.5 text-sm font-bold tracking-tight sm:inline-flex"
          >
            {copy(locale, "Newsletter", "Newsletter")}
          </TrackedLink>
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  );
}
