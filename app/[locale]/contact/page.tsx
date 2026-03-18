import { Github, Linkedin, Mail } from "lucide-react";

import { TrackedExternalLink } from "@/components/tracked-external-link";
import { buildPageMetadata } from "@/lib/seo";
import { Locale, copy, siteConfig } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return buildPageMetadata({
    locale,
    title: copy(
      locale,
      "Contact Michael Barbosa Santos",
      "Contato com Michael Barbosa Santos",
    ),
    description: copy(
      locale,
      "Get in touch for consulting, technical leadership, partnerships, and growth-focused data or AI initiatives.",
      "Entre em contato para consultoria, lideranca tecnica, parcerias e iniciativas de dados ou IA focadas em crescimento.",
    ),
    path: "/contact",
    keywords: ["contact", "consulting", "data engineering advisor"],
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return (
    <main className="container-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
            {copy(locale, "Contact", "Contato")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
            {copy(
              locale,
              "Ready to create value with modern data and AI solutions.",
              "Pronto para criar valor com solucoes modernas de dados e IA.",
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            {copy(
              locale,
              "Reach out to discuss new opportunities, strategic consulting, technical leadership, or partnerships that drive measurable results.",
              "Entre em contato para discutir novas oportunidades, consultoria estrategica, lideranca tecnica ou parcerias que gerem resultados mensuraveis.",
            )}
          </p>
          <p className="mt-3 text-sm font-medium text-[var(--accent-mint)]">
            {copy(
              locale,
              "Currently open to consulting and technical leadership opportunities",
              "Aberto a oportunidades de consultoria e lideranca tecnica",
            )}
          </p>
        </section>

        <div className="grid gap-5 sm:grid-cols-3">
          <TrackedExternalLink
            href={`mailto:${siteConfig.email}`}
            className="section-card group flex flex-col items-center gap-4 rounded-3xl p-6 text-center"
            eventName="contact_click"
            eventParams={{ channel: "email", location: "contact_page" }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/12 text-[var(--primary)] transition-colors group-hover:bg-blue-500/20">
              <Mail size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Email
              </p>
              <p className="link-safe-break mt-1 text-sm text-white">
                {siteConfig.email}
              </p>
            </div>
          </TrackedExternalLink>

          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="section-card group flex flex-col items-center gap-4 rounded-3xl p-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-[var(--accent-mint)] transition-colors group-hover:bg-emerald-500/20">
              <Github size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                GitHub
              </p>
              <p className="mt-1 text-sm text-white">michael-eng-ai</p>
            </div>
          </a>

          <TrackedExternalLink
            href={siteConfig.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="section-card group flex flex-col items-center gap-4 rounded-3xl p-6 text-center"
            eventName="contact_click"
            eventParams={{ channel: "linkedin", location: "contact_page" }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/12 text-[var(--accent)] transition-colors group-hover:bg-purple-500/20">
              <Linkedin size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                LinkedIn
              </p>
              <p className="mt-1 text-sm text-white">michael-bs</p>
            </div>
          </TrackedExternalLink>
        </div>
      </div>
    </main>
  );
}
