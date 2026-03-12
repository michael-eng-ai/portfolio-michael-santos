import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { featuredProjects } from "@/data/featuredProjects";

export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-2">
            Featured Projects
          </p>
          <h2 className="font-display text-foreground mb-4">
            Business Problems Connected To Technical Solutions
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            These projects show how I frame data engineering work as a business case first and a technical implementation second, with a clear path to production hardening.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProjects.map((project) => (
            <Card
              key={project.slug}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-border"
            >
              <div className="p-6 space-y-4">
                <div>
                  <p className="font-accent text-xs text-primary uppercase tracking-widest mb-2">
                    {project.subtitle}
                  </p>
                  <h3 className="font-heading text-foreground">
                    {project.title}
                  </h3>
                </div>

                <p className="font-body text-sm text-muted-foreground">
                  {project.summary}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.stack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-muted text-foreground text-xs rounded-full font-accent"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  {project.impact.map((item, idx) => (
                    <p
                      key={idx}
                      className="font-accent text-xs text-primary flex items-start gap-2"
                    >
                      <span className="mt-1">✓</span>
                      {item}
                    </p>
                  ))}
                </div>

                <a
                  href={`/project/${project.slug}`}
                  className="inline-flex items-center text-primary font-accent text-sm hover:gap-2 transition-all group pt-2"
                >
                  View Case Study
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
