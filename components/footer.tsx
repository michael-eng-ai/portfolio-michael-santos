import Link from "next/link";

import { TrackedExternalLink } from "@/components/tracked-external-link";
import { Locale, copy, localePath, siteConfig } from "@/lib/site";

type FooterProps = {
  locale: Locale;
};

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="footer-shell border-t border-white/8 py-12 sm:py-14">
      <div className="container-shell grid gap-10 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-3">
          <p className="display-copy text-lg font-semibold text-white">{siteConfig.name}</p>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            {copy(
              locale,
              "A bilingual publication on digital strategy, AI, data platforms, and execution narratives that support business growth.",
              "Uma publicacao bilingue sobre estrategia digital, IA, plataformas de dados e narrativas de execucao que apoiam crescimento de negocio.",
            )}
          </p>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <p className="font-semibold text-white">{copy(locale, "Navigation", "Navegacao")}</p>
          <div className="flex flex-col gap-1">
            <Link className="brand-link inline-block py-1.5" href={localePath(locale, "/articles")}>{copy(locale, "Insights", "Insights")}</Link>
            <Link className="brand-link inline-block py-1.5" href={localePath(locale, "/news")}>{copy(locale, "News", "Noticias")}</Link>
            <Link className="brand-link inline-block py-1.5" href={localePath(locale, "/projects")}>{copy(locale, "Business Cases", "Casos")}</Link>
            <Link className="brand-link inline-block py-1.5" href={localePath(locale, "/newsletter")}>{copy(locale, "Newsletter", "Newsletter")}</Link>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <p className="font-semibold text-white">{copy(locale, "Profiles", "Perfis")}</p>
          <div className="flex flex-col gap-1">
            <a className="brand-link inline-block py-1.5" href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <TrackedExternalLink
              className="brand-link inline-block py-1.5"
              href={siteConfig.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              eventName="contact_click"
              eventParams={{ channel: "linkedin", location: "footer" }}
            >
              LinkedIn
            </TrackedExternalLink>
            <TrackedExternalLink
              className="brand-link inline-block py-1.5"
              href={`mailto:${siteConfig.email}`}
              eventName="contact_click"
              eventParams={{ channel: "email", location: "footer" }}
            >
              {siteConfig.email}
            </TrackedExternalLink>
          </div>
        </div>
      </div>

      <div className="container-shell mt-10 border-t border-white/6 pt-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} {siteConfig.name}</p>
      </div>
    </footer>
  );
}
