"use client";

import { FormEvent, useState } from "react";

import { Locale, copy } from "@/lib/site";

type NewsletterFormProps = {
  locale: Locale;
  source: string;
};

export function NewsletterForm({ locale, source }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, locale, source }),
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
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : copy(locale, "Unexpected error.", "Erro inesperado."),
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="section-card rounded-3xl p-6">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
            {copy(locale, "Newsletter", "Newsletter")}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {copy(
              locale,
              "Receive curated intelligence on growth, efficiency, and digital strategy.",
              "Receba inteligencia curada sobre crescimento, eficiencia e estrategia digital.",
            )}
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy(locale, "your@email.com", "seu@email.com")}
            required
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="brand-button-primary rounded-2xl px-5 py-3 text-sm font-semibold transition hover:brightness-105 disabled:opacity-60"
          >
            {copy(locale, "Subscribe", "Inscrever")}
          </button>
        </div>

        <p className="text-sm text-slate-400">
          {copy(
            locale,
            "One email per week. No spam. Only high-signal content for decision-makers.",
            "Um email por semana. Sem spam. Apenas conteudo de alto sinal para tomadores de decisao.",
          )}
        </p>

        {message ? (
          <p
            className={`text-sm ${
              status === "success" ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
