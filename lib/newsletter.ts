import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

type SubscribeInput = {
  email: string;
  locale: "en" | "pt";
  source: string;
};

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function subscribeToNewsletter(input: SubscribeInput) {
  const supabase = getSupabaseAdminClient();

  const insertPayload = {
    email: input.email.toLowerCase().trim(),
    locale: input.locale,
    source: input.source,
    consented_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(insertPayload, { onConflict: "email" });

  if (error) {
    throw new Error(error.message);
  }

  const resend = getResendClient();

  if (resend && process.env.NEWSLETTER_FROM_EMAIL) {
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
  }

  return { success: true };
}
