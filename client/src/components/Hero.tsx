import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/hero-data-strategy.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          opacity: 0.15,
        }}
      />

      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="font-accent text-primary text-sm uppercase tracking-widest">
                Senior Data Engineer • Cloud Data Platforms
              </p>
              <h1 className="font-display text-foreground leading-tight">
                Building Cloud Data Platforms That Connect Business Problems To Reliable Technical Solutions
              </h1>
              <p className="font-body text-lg text-muted-foreground max-w-lg">
                I design and implement data platforms, streaming pipelines, and analytics systems across AWS, Azure, and GCP using Spark, dbt, Airflow, Terraform, Kafka, and SQL.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="#projects"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors group"
              >
                View Projects
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </a>
              <a
                href="/resume/michael-barbosa-santos-resume-en.md"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary rounded-md font-accent hover:bg-primary/5 transition-colors"
                download
              >
                Download Resume
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary rounded-md font-accent hover:bg-primary/5 transition-colors"
              >
                Contact
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <p className="font-display text-2xl text-primary">3</p>
                <p className="font-accent text-sm text-muted-foreground">Clouds</p>
              </div>
              <div>
                <p className="font-display text-2xl text-primary">6</p>
                <p className="font-accent text-sm text-muted-foreground">Featured Case Studies</p>
              </div>
              <div>
                <p className="font-display text-2xl text-primary">1</p>
                <p className="font-accent text-sm text-muted-foreground">Clear Positioning</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-md rounded-xl border border-border bg-background/80 p-8 backdrop-blur">
                <p className="font-accent text-xs uppercase tracking-widest text-primary mb-3">
                  Value Proposition
                </p>
                <h2 className="font-heading text-foreground mb-4">
                  From ingestion to analytics consumption
                </h2>
                <ul className="space-y-3 font-body text-sm text-muted-foreground">
                  <li>- Cloud data platforms on AWS, Azure, and GCP</li>
                  <li>- Spark, dbt, Airflow, Terraform, Kafka, and SQL</li>
                  <li>- Business-facing case studies linked to technical implementations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
