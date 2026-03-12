import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: "Michael Santos",
    description: siteConfig.description,
    start_url: "/en",
    display: "standalone",
    background_color: "#0c1827",
    theme_color: "#0c1827",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
