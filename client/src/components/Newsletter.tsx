import { Mail, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function Newsletter() {
  const { trackNewsletterSignup } = useAnalytics();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      trackNewsletterSignup(email);
      toast.success("✓ Email registrado! Verifique sua caixa de entrada.");
      setEmail("");
      setLoading(false);
    }, 1000);
  };

  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5 border-t border-b border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div>
              <p className="font-accent text-primary text-sm uppercase tracking-widest mb-3">
                Recurso Gratuito
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                10 Passos para Implementar Dados Estratégicos
              </h2>
              <p className="font-body text-muted-foreground text-lg mb-6">
                Guia prático com estratégias que usei para escalar pipelines de dados em empresas Fortune 500. Inclui checklist, templates e roadmap.
              </p>

              {/* Benefits */}
              <ul className="space-y-3">
                {[
                  "Arquitetura moderna de dados",
                  "Estratégia de governança",
                  "Roadmap de implementação",
                  "Templates prontos para usar",
                ].map((benefit, idx) => (
                  <li
                    key={idx}
                    className="font-body text-foreground flex items-center gap-3"
                  >
                    <span className="text-primary font-bold">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Side - Form */}
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <Download size={20} className="text-primary" />
                <span className="font-accent text-primary text-sm uppercase tracking-widest">
                  Baixe Agora
                </span>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block font-accent text-foreground text-sm mb-2"
                  >
                    Seu Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-accent font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  {loading ? "Enviando..." : "Receber Guia Gratuito"}
                </button>

                <p className="font-body text-xs text-muted-foreground text-center">
                  Sem spam. Apenas insights sobre dados e estratégia. Cancele quando quiser.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
