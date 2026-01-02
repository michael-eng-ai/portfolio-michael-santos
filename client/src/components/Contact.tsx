import { Mail, Phone, Linkedin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAnalytics } from "@/hooks/useAnalytics";
import { toast } from "sonner";

export default function Contact() {
  const { trackContactFormSubmit } = useAnalytics();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackContactFormSubmit(formData.company);
    toast.success("✓ Mensagem enviada! Responderei em até 24 horas.");
    setFormData({ name: "", email: "", company: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Info */}
          <div className="space-y-8">
            <div>
              <p className="font-accent text-primary text-sm uppercase tracking-widest mb-2">
                Contato
              </p>
              <h2 className="font-display text-foreground mb-4">
                Vamos Conversar
              </h2>
              <p className="font-body text-lg text-muted-foreground">
                Tenho interesse em entender seus desafios e como posso ajudar a transformar seus dados em vantagem competitiva.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-accent text-foreground">Email</p>
                  <a
                    href="mailto:eng.michaelbarbosa@hotmail.com"
                    className="font-body text-muted-foreground hover:text-primary transition-colors"
                  >
                    eng.michaelbarbosa@hotmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="font-accent text-foreground">Telefone</p>
                  <a
                    href="tel:+5583986182781"
                    className="font-body text-muted-foreground hover:text-primary transition-colors"
                  >
                    +55 (83) 98618-2781
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Linkedin size={20} />
                </div>
                <div>
                  <p className="font-accent text-foreground">LinkedIn</p>
                  <a
                    href="https://www.linkedin.com/in/michael-bs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-muted-foreground hover:text-primary transition-colors"
                  >
                    linkedin.com/in/michael-bs
                  </a>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="pt-8 border-t border-border">
              <p className="font-accent text-foreground mb-2">Empresa</p>
              <p className="font-body text-muted-foreground">
                <strong>Datasanti Consultoria</strong>
                <br />
                Especializada em soluções de engenharia de dados e consultoria estratégica
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-background rounded-lg border border-border p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block font-accent text-foreground text-sm mb-2">
                  Nome
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-accent text-foreground text-sm mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="company" className="block font-accent text-foreground text-sm mb-2">
                  Empresa
                </label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div>
                <label htmlFor="message" className="block font-accent text-foreground text-sm mb-2">
                  Mensagem
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Conte-me sobre seu projeto ou desafio..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!formData.name || !formData.email || !formData.message}
              >
                Enviar Mensagem
              </Button>
                <a
                  href="#calendly"
                  className="inline-flex items-center justify-center px-4 py-2 bg-muted text-foreground border border-border rounded-md font-accent hover:bg-muted/80 transition-colors"
                >
                  Agendar Agora
                </a>
              </div>

              <p className="font-body text-xs text-muted-foreground text-center">
                Responderei em até 24 horas ou agende uma consulta direta
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
