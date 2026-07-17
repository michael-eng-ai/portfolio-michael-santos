import { Github, Linkedin, Mail } from "lucide-react";

import { TrackedExternalLink } from "@/components/tracked-external-link";
import { buildPageMetadata } from "@/lib/seo";
import { Locale, copy, siteConfig } from "@/lib/site";

function XIcon({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

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
    <main className="px-6 pb-20 pt-28 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <h1 className="mb-4 text-4xl font-extrabold uppercase tracking-tight text-gray-900 md:text-5xl">
            {copy(locale, "Contact", "Contato")}
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
            {copy(
              locale,
              "Ready to create value with modern data and AI solutions",
              "Pronto para criar valor com solucoes modernas de dados e IA",
            )}
          </p>
          <p className="mt-6 text-lg font-light leading-relaxed text-gray-500">
            {copy(
              locale,
              "Reach out to discuss new opportunities, strategic consulting, technical leadership, or partnerships that drive measurable results.",
              "Entre em contato para discutir novas oportunidades, consultoria estrategica, lideranca tecnica ou parcerias que gerem resultados mensuraveis.",
            )}
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-widest text-[var(--accent-mint)]">
            {copy(
              locale,
              "Currently open to consulting and technical leadership opportunities",
              "Aberto a oportunidades de consultoria e lideranca tecnica",
            )}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <TrackedExternalLink
            href={`mailto:${siteConfig.email}`}
            className="group bg-white p-10 monolith-shadow transition-all duration-500 hover:bg-gray-50"
            eventName="contact_click"
            eventParams={{ channel: "email", location: "contact_page" }}
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[var(--primary)] transition-colors group-hover:bg-blue-100">
              <Mail aria-hidden="true" size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Email</p>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 break-all">
              {siteConfig.email}
            </p>
          </TrackedExternalLink>

          <TrackedExternalLink
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            eventName="external_link_click"
            eventParams={{ channel: "github", location: "contact_page" }}
            className="group bg-white p-10 monolith-shadow transition-all duration-500 hover:bg-gray-50"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-[var(--accent-mint)] transition-colors group-hover:bg-emerald-100">
              <Github aria-hidden="true" size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">GitHub</p>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900">michael-eng-ai</p>
          </TrackedExternalLink>

          <TrackedExternalLink
            href={siteConfig.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="group bg-white p-10 monolith-shadow transition-all duration-500 hover:bg-gray-50"
            eventName="contact_click"
            eventParams={{ channel: "linkedin", location: "contact_page" }}
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-[var(--accent)] transition-colors group-hover:bg-purple-100">
              <Linkedin aria-hidden="true" size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">LinkedIn</p>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900">michael-bs</p>
          </TrackedExternalLink>

          <TrackedExternalLink
            href={siteConfig.xUrl}
            target="_blank"
            rel="noreferrer"
            className="group bg-white p-10 monolith-shadow transition-all duration-500 hover:bg-gray-50"
            eventName="external_link_click"
            eventParams={{ channel: "x", location: "contact_page" }}
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-900 transition-colors group-hover:bg-gray-200">
              <XIcon size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">X</p>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900">michael_ai_4o</p>
          </TrackedExternalLink>
        </div>
      </div>
    </main>
  );
}
