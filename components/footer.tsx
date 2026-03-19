import Link from "next/link";

import { TrackedExternalLink } from "@/components/tracked-external-link";
import { Locale, copy, localePath, siteConfig } from "@/lib/site";

type FooterProps = {
  locale: Locale;
};

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-6 py-20 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="mb-8 text-2xl font-black uppercase tracking-tighter text-gray-900">
              {siteConfig.name}
            </div>
            <p className="mb-10 max-w-md text-sm font-medium uppercase leading-relaxed tracking-widest text-gray-500">
              {copy(
                locale,
                "Precision in Data Architecture. Engineering clarity from complexity.",
                "Precisao em Arquitetura de Dados. Engenhando clareza a partir da complexidade.",
              )}
            </p>
            <div className="flex gap-6">
              <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-[var(--accent-mint)]">
                GitHub
              </a>
              <TrackedExternalLink
                href={siteConfig.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-[var(--accent-mint)]"
                eventName="contact_click"
                eventParams={{ channel: "linkedin", location: "footer" }}
              >
                LinkedIn
              </TrackedExternalLink>
              <TrackedExternalLink
                href={`mailto:${siteConfig.email}`}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-[var(--accent-mint)]"
                eventName="contact_click"
                eventParams={{ channel: "email", location: "footer" }}
              >
                Email
              </TrackedExternalLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3">
            <div>
              <h5 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-mint)]">
                {copy(locale, "Solutions", "Solucoes")}
              </h5>
              <ul className="space-y-5">
                <li><Link href={localePath(locale, "/projects")} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">{copy(locale, "Business Cases", "Casos")}</Link></li>
                <li><Link href={localePath(locale, "/articles")} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">{copy(locale, "Insights", "Insights")}</Link></li>
                <li><Link href={localePath(locale, "/news")} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">{copy(locale, "News", "Noticias")}</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-mint)]">
                {copy(locale, "Company", "Empresa")}
              </h5>
              <ul className="space-y-5">
                <li><Link href={localePath(locale, "/resume")} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">{copy(locale, "Resume", "Curriculo")}</Link></li>
                <li><Link href={localePath(locale, "/newsletter")} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">Newsletter</Link></li>
                <li><Link href={localePath(locale, "/contact")} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">{copy(locale, "Contact", "Contato")}</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-mint)]">
                {copy(locale, "Connect", "Conectar")}
              </h5>
              <ul className="space-y-5">
                <li><a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">GitHub</a></li>
                <li><a href={siteConfig.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">LinkedIn</a></li>
                <li><a href={`mailto:${siteConfig.email}`} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">Email</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-10 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
            &copy; {new Date().getFullYear()} {siteConfig.name}. {copy(locale, "Precision in Data Architecture.", "Precisao em Arquitetura de Dados.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
