import { Resend } from "resend";

import { upsertNewsletterSubscriber } from "@/lib/database";

type SubscribeInput = {
  email: string;
  locale: "en" | "pt";
  source: string;
};

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function subscribeToNewsletter(input: SubscribeInput) {
  const insertPayload = {
    email: input.email.toLowerCase().trim(),
    locale: input.locale,
    source: input.source,
    consented_at: new Date().toISOString(),
  };

  await upsertNewsletterSubscriber(insertPayload);

  const resend = getResendClient();

  if (resend && process.env.NEWSLETTER_FROM_EMAIL) {
    try {
      await resend.emails.send({
        from: process.env.NEWSLETTER_FROM_EMAIL,
        to: insertPayload.email,
        subject:
          input.locale === "pt"
            ? "Inscrição confirmada na newsletter"
            : "Your newsletter subscription is confirmed",
        html:
          input.locale === "pt"
            ? "<p>Obrigado por se inscrever. Em breve voce recebera novos artigos, projetos e referencias ligando GitHub, site e LinkedIn.</p>"
            : "<p>Thanks for subscribing. You will receive new articles, project stories, and references that connect GitHub, the site, and LinkedIn.</p>",
      });
    } catch (error) {
      console.error("Newsletter welcome email failed", error);
    }
  }

  return { success: true };
}
