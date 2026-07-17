import { NewsletterForm } from "@/components/newsletter-form";
import { type Locale, copy } from "@/lib/site";

type InlineNewsletterCtaProps = {
  locale: Locale;
  source: string;
};

export function InlineNewsletterCta({ locale, source }: InlineNewsletterCtaProps) {
  return (
    <div className="my-10">
      <NewsletterForm
        locale={locale}
        source={source}
        title={copy(
          locale,
          "Want the next signal before it hits your backlog?",
          "Quer o proximo sinal antes de ele virar backlog?",
        )}
        description={copy(
          locale,
          "One short weekly note: market pressure, delivery pattern, and a proof link you can reuse.",
          "Uma nota semanal curta: pressao de mercado, padrao de entrega e um link de prova que voce pode reutilizar.",
        )}
      />
    </div>
  );
}
