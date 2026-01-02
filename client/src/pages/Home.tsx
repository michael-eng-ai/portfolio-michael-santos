import { Toaster } from "@/components/ui/sonner";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Services from "@/components/Services";
import Blog from "@/components/Blog";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import About from "@/components/About";
import Contact from "@/components/Contact";

export default function Home() {
  // Toaster is already in App.tsx, no need to add it here
  return (
    <div>
      <Hero />
      <Projects />
      <Services />
      <Blog />
      <Testimonials />
      <Newsletter />
      <About />
      <Contact />
    </div>
  );
}
