import { ArrowLeft, Github, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { featuredProjectsBySlug } from "@/data/featuredProjects";

export default function ProjectDetail() {
  const [location] = useLocation();
  const projectId = location.split("/").pop();
  const project = projectId ? featuredProjectsBySlug[projectId] : undefined;

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-foreground mb-4">Project not found</h1>
          <Link href="/">
            <a className="inline-flex items-center text-primary font-accent hover:gap-2 transition-all group">
              <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <a className="inline-flex items-center text-primary font-accent text-sm hover:gap-1 transition-all group">
              <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
              Back
            </a>
          </Link>
        </div>
      </header>

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-12 border-b border-border pb-12">
            <p className="font-accent text-primary text-sm uppercase tracking-widest mb-2">
              Case Study
            </p>
            <h1 className="font-display text-foreground mb-4">{project.title}</h1>
            <p className="font-body text-lg text-muted-foreground max-w-3xl">
              {project.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 pb-12 border-b border-border">
            <div>
              <p className="font-accent text-muted-foreground text-xs uppercase mb-2">
                Repository
              </p>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-primary hover:underline"
              >
                <Github size={16} />
                Open on GitHub
              </a>
            </div>
            <div>
              <p className="font-accent text-muted-foreground text-xs uppercase mb-2">
                Focus
              </p>
              <p className="font-body text-foreground">Business problem to technical execution</p>
            </div>
            <div>
              <p className="font-accent text-muted-foreground text-xs uppercase mb-2">
                Type
              </p>
              <p className="font-body text-foreground">Production-minded portfolio case</p>
            </div>
          </div>

          <section className="mb-12">
            <h2 className="font-heading text-foreground mb-4">Business Problem</h2>
            <p className="font-body text-muted-foreground leading-7">
              {project.businessProblem}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-heading text-foreground mb-4">Technical Solution</h2>
            <ul className="space-y-3">
              {project.technicalSolution.map((item) => (
                <li key={item} className="font-body text-muted-foreground flex items-start gap-3">
                  <span className="text-primary font-bold">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12 bg-muted/30 rounded-lg p-8">
            <h2 className="font-heading text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="text-primary" />
              Why It Matters
            </h2>
            <ul className="space-y-3">
              {project.impact.map((item, idx) => (
                <li key={idx} className="font-body text-foreground flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="font-heading text-foreground mb-4">Architecture Summary</h2>
            <p className="font-body text-muted-foreground leading-7">
              {project.architectureSummary}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-heading text-foreground mb-4">Stack</h2>
            <div className="flex flex-wrap gap-3">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-2 rounded-full bg-muted text-foreground text-sm font-accent"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <h3 className="font-heading text-foreground mb-3">
              Explore the implementation details
            </h3>
            <p className="font-body text-muted-foreground mb-6">
              This page focuses on the business framing. The GitHub repository contains the implementation details, code structure, and technical artifacts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors"
              >
                View Repository
              </a>
              <a
                href="/#contact"
                className="inline-flex items-center justify-center px-8 py-3 border border-primary text-primary rounded-md font-accent hover:bg-primary/5 transition-colors"
              >
                Contact Michael
              </a>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
