"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Locale, copy, localePath } from "@/lib/site";

type MobileNavProps = {
  locale: Locale;
};

export function MobileNav({ locale }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navItems = [
    { href: localePath(locale, "/articles"), label: copy(locale, "Insights", "Insights") },
    { href: localePath(locale, "/news"), label: copy(locale, "News", "Noticias") },
    { href: localePath(locale, "/projects"), label: copy(locale, "Business Cases", "Casos de Negocio") },
    { href: localePath(locale, "/newsletter"), label: copy(locale, "Newsletter", "Newsletter") },
    { href: localePath(locale, "/contact"), label: copy(locale, "Contact", "Contato") },
    { href: localePath(locale, "/resume"), label: copy(locale, "Resume", "Curriculo") },
  ];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="fixed inset-0 top-[73px] z-40 bg-[rgba(11,20,31,0.97)] backdrop-blur-xl">
          <nav className="container-shell flex flex-col gap-1 py-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-5 py-4 text-lg font-medium transition ${
                    isActive
                      ? "bg-white/8 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
