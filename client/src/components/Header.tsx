import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Projetos", href: "#projects" },
    { label: "Serviços", href: "#services" },
    { label: "Blog", href: "#blog" },
    { label: "Sobre", href: "#about" },
    { label: "Contato", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <a className="font-display text-2xl text-foreground hover:text-primary transition-colors">
            MS
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-accent text-foreground hover:text-primary transition-colors text-sm"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-accent text-sm hover:bg-primary/90 transition-colors"
          >
            Conversar
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-accent text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-accent text-center hover:bg-primary/90 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Conversar
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
