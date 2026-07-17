import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { findLocalArticleCoverPath, isRasterArticleCover } from "@/lib/article-covers";
import { getArticleBySlug } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import type { Locale } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Article cover";

function mimeFromPath(filePath: string): string {
  if (/\.jpe?g$/i.test(filePath)) return "image/jpeg";
  if (/\.webp$/i.test(filePath)) return "image/webp";
  if (/\.png$/i.test(filePath)) return "image/png";
  return "application/octet-stream";
}

function resolveCoverDiskPath(slug: string, imageUrl?: string): string | undefined {
  const local = findLocalArticleCoverPath(slug);
  if (local) {
    return local;
  }

  if (imageUrl?.startsWith("/images/") && isRasterArticleCover(imageUrl)) {
    return path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
  }

  return undefined;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug);
  const title = article?.locales[locale as Locale]?.title ?? siteConfig.title;
  const diskPath = resolveCoverDiskPath(slug, article?.imageUrl);

  if (diskPath) {
    try {
      const bytes = await readFile(diskPath);
      return new Response(bytes, {
        headers: {
          "Content-Type": mimeFromPath(diskPath),
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    } catch {
      // Fall through to branded synthetic OG card.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 18% 20%, rgba(109, 185, 255, 0.28), transparent 32%), radial-gradient(circle at 82% 22%, rgba(157, 140, 255, 0.28), transparent 28%), linear-gradient(160deg, #0c1827 0%, #102032 45%, #13253a 100%)",
          padding: "54px 60px",
          color: "#f8fbff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              borderRadius: 999,
              border: "1px solid rgba(190, 207, 230, 0.18)",
              background: "rgba(255, 255, 255, 0.06)",
              padding: "10px 18px",
              fontSize: 24,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Insight
          </div>
          <div
            style={{
              display: "flex",
              borderRadius: 24,
              border: "1px solid rgba(190, 207, 230, 0.18)",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "18px 22px",
              fontSize: 28,
            }}
          >
            michael.business
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {title.length > 90 ? `${title.slice(0, 87)}...` : title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 28, color: "#dce8fb" }}>
            {siteConfig.name}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#90b6ff" }}>
            {article?.publishedAt ?? ""}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
