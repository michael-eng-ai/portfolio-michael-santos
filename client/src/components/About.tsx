import { CheckCircle2 } from "lucide-react";

const strengths = [
  "Multi-cloud delivery across AWS, Azure, and GCP",
  "Hands-on work with Spark, dbt, Airflow, Terraform, Kafka, and SQL",
  "Experience connecting platform design to analytics consumption",
  "Delivery in regulated and data-intensive environments",
];

const skills = [
  "Spark and PySpark",
  "dbt and analytics engineering",
  "Airflow and orchestration",
  "Kafka and streaming",
  "Terraform and cloud infrastructure",
  "Dimensional modeling and data quality",
];

export default function About() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-3">
            About
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Senior Data Engineer With An End-To-End Delivery Mindset
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            I work across the full path from ingestion and transformation to modeling, governance, and analytics consumption, with a strong focus on production-ready data systems.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          <div className="space-y-8">
            <p className="font-body text-lg text-muted-foreground">
              My background across data analysis, BI, and data engineering gives me a practical perspective on how technical architecture affects downstream business decisions. I focus on systems that are scalable, understandable, and useful to the teams who depend on them.
            </p>

            <div className="space-y-4">
              <h3 className="font-heading text-foreground text-xl">
                What I Bring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strengths.map((skill, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="font-accent text-foreground flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-primary" />
                      {skill}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors"
            >
              Contact
            </a>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-foreground text-xl mb-6">
                Core Skills
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-muted rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <p className="font-accent text-foreground text-sm">
                      {skill}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
