"use client";

import { FormEvent, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { Locale, copy } from "@/lib/site";

type NewsletterFormProps = {
  locale: Locale;
  source: string;
  title?: string;
  description?: string;
  eyebrow?: string;
  disclaimer?: string;
};

export function NewsletterForm({
  locale,
  source,
  title,
  description,
  eyebrow,
  disclaimer,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      trackEvent("newsletter_submit_started", { locale, source });

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, locale, source, website }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Newsletter signup failed.");
      }

      setStatus("success");
      setMessage(
        copy(
          locale,
          "You are subscribed. Check your inbox for the welcome message.",
          "Inscricao concluida. Verifique sua caixa de entrada para a mensagem de boas-vindas.",
        ),
      );
      setEmail("");
      setWebsite("");
      trackEvent("newsletter_signup", { locale, source });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : copy(locale, "Unexpected error.", "Erro inesperado."),
      );
      trackEvent("newsletter_signup_error", { locale, source });
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
      <div className="space-y-4">
        <div className="sr-only" aria-hidden="true">
          <label htmlFor={`website-${source}`}>Website</label>
          <input
            id={`website-${source}`}
            type="text"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--primary)]">
            {eyebrow ?? copy(locale, "Newsletter", "Newsletter")}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-gray-900">
            {title ?? copy(
              locale,
              "Receive curated intelligence on growth, efficiency, and digital strategy.",
              "Receba inteligencia curada sobre crescimento, eficiencia e estrategia digital.",
            )}
          </h3>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy(locale, "your@email.com", "seu@email.com")}
            required
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--primary)]"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="brand-button-primary rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {copy(locale, "Subscribe", "Inscrever")}
          </button>
        </div>

        <p className="text-sm text-gray-500">
          {disclaimer ?? copy(
            locale,
            "One email per week. No spam. Only high-signal content for decision-makers.",
            "Um email por semana. Sem spam. Apenas conteudo de alto sinal para tomadores de decisao.",
          )}
        </p>

        {message ? (
          <p
            className={`text-sm ${
              status === "success" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
