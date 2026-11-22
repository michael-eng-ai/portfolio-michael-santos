import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

const title = "Page not found";
const description = "The requested content does not exist or is no longer available.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  // Replace the root layout canonical, which otherwise points every 404 at the homepage.
  alternates: { canonical: "./" },
  openGraph: {
    title,
    description,
    // `./` resolves to the requested path, not https://michael.business.
    url: "./",
    siteName: siteConfig.name,
    type: "website",
    // Own `images` so the root opengraph-image profile card is not attached.
    images: [],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: [],
  },
};

export default function NotFound() {
  return (
    <main className="container-shell py-24">
      <div className="section-card rounded-3xl p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Page not found</h1>
        <p className="mt-4 max-w-xl text-slate-400">
          The requested content does not exist or is no longer available.
        </p>
      </div>
    </main>
  );
}
