import { useEffect } from "react";

export default function CalendlyWidget() {
  useEffect(() => {
    // Load Calendly script
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5 border-t border-border">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-3">
            Agende uma Consulta
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Vamos Conversar Sobre Seu Projeto
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Escolha um horário que funcione melhor para você. Consulta inicial gratuita de 30 minutos.
          </p>
        </div>

        {/* Calendly Widget */}
        <div className="max-w-2xl mx-auto bg-card rounded-lg border border-border overflow-hidden shadow-lg">
          <div
            className="calendly-inline-widget"
            data-url="https://calendly.com/michaelsantos?hide_event_type_details=1&hide_gdpr_block=1"
            style={{ minHeight: "630px" }}
          />
        </div>

        {/* Info */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <p className="font-body text-muted-foreground">
            Não consegue encontrar um horário? Envie um email para{" "}
            <a
              href="mailto:contato@michael.business"
              className="text-primary hover:underline font-semibold"
            >
              contato@michael.business
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
