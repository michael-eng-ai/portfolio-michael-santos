import { Linkedin, Mail, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <p className="font-display text-2xl">MS</p>
            <p className="font-body text-sm opacity-80">
              Engenharia de Dados & Consultoria Estratégica
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <p className="font-accent text-sm font-semibold">Links Rápidos</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="#projects"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                >
                  Projetos
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                >
                  Serviços
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                >
                  Sobre
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                >
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <p className="font-accent text-sm font-semibold">Redes Sociais</p>
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/in/michael-bs/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background/20 hover:bg-background/30 transition-colors"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="mailto:eng.michaelbarbosa@hotmail.com"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background/20 hover:bg-background/30 transition-colors"
              >
                <Mail size={18} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background/20 hover:bg-background/30 transition-colors"
              >
                <Github size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-background/20 my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-sm opacity-60">
            © {currentYear} Michael Santos. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="font-body text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              Política de Privacidade
            </a>
            <a
              href="#"
              className="font-body text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              Termos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
