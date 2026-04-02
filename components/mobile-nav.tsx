"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { Locale, copy, localePath } from "@/lib/site";

type MobileNavProps = {
  locale: Locale;
};

export function MobileNav({ locale }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navItems = [
    { href: localePath(locale, "/projects"), label: copy(locale, "Success Stories", "Casos"), target: "projects" },
    { href: localePath(locale, "/articles"), label: copy(locale, "Insights", "Insights"), target: "articles" },
    { href: localePath(locale, "/news"), label: copy(locale, "News", "Noticias"), target: "news" },
    { href: localePath(locale, "/radar"), label: copy(locale, "Radar", "Radar"), target: "radar" },
    { href: localePath(locale, "/newsletter"), label: copy(locale, "Newsletter", "Newsletter"), target: "newsletter" },
    { href: localePath(locale, "/resume"), label: copy(locale, "Resume", "Curriculo"), target: "resume" },
    { href: localePath(locale, "/contact"), label: copy(locale, "Contact", "Contato"), target: "contact" },
  ];

  const panel = open ? (
    <div className="fixed inset-x-0 bottom-0 top-[80px] z-50 overflow-y-auto bg-white lg:hidden">
      <nav id="mobile-navigation" className="container-shell flex flex-col gap-1 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() =>
                trackEvent("navigation_click", {
                  location: "mobile_nav",
                  target: item.target,
                  locale,
                })
              }
              className={`rounded-2xl px-5 py-4 text-lg font-medium transition ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  ) : null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mounted && panel && createPortal(panel, document.body)}
    </div>
  );
}
