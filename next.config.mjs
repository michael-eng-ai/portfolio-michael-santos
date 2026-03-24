/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:locale/articles/building-trustworthy-and-scalable-data-platforms-with-modern-engineering-patterns",
        destination: "/:locale/articles/building-trustworthy-and-scalable-modern-data-platforms",
        permanent: true,
      },
      {
        source: "/:locale/articles/building-trustworthy-scalable-analytics-pipelines-with-modern-data-engineering",
        destination: "/:locale/articles/building-trustworthy-and-scalable-modern-data-platforms",
        permanent: true,
      },
      {
        source: "/:locale/articles/agentic-ai-and-data-engineering-how-autonomous-systems-are-rewriting-the-pipeline-playbook-in-2026",
        destination: "/:locale/articles/agentic-ai-and-data-engineering-the-revolution-of-autonomous-agents-in-modern-pipelines",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
