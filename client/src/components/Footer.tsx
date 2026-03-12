import { Linkedin, Mail, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <p className="font-display text-2xl">MS</p>
            <p className="font-body text-sm opacity-80">
              Senior Data Engineer focused on cloud data platforms and analytics systems.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-accent text-sm font-semibold">Quick Links</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="#projects"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/resume/michael-barbosa-santos-resume-en.md"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                  download
                >
                  Resume
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="font-body text-sm opacity-80 hover:opacity-100 transition-opacity"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="font-accent text-sm font-semibold">Profiles</p>
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
                href="https://github.com/michael-eng-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background/20 hover:bg-background/30 transition-colors"
              >
                <Github size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-sm opacity-60">
            © {currentYear} Michael Barbosa Santos. All rights reserved.
          </p>
          <p className="font-body text-sm opacity-60">
            Built to connect business context with technical execution.
          </p>
        </div>
      </div>
    </footer>
  );
}
