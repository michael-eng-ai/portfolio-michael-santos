import { promises as fs } from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

import type { GenerateCoverImageResult } from "@/lib/image-gen";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Local branded raster cover when Gemini image quota/API is unavailable.
 * Produces a PNG suitable for OG / LinkedIn / X (not a generic SVG placeholder).
 */
export async function generateLocalCoverImage(input: {
  slug: string;
  title: string;
  eyebrow?: string;
  outputDir?: string;
  publicPrefix?: string;
}): Promise<GenerateCoverImageResult> {
  const outputDir = input.outputDir
    ? path.resolve(input.outputDir)
    : path.join(process.cwd(), "public", "images", "articles");
  const publicPrefix = input.publicPrefix ?? "/images/articles";
  const title =
    input.title.length > 96 ? `${input.title.slice(0, 93).trimEnd()}...` : input.title;
  const eyebrow = (input.eyebrow ?? "Insight").slice(0, 40);

  const response = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 18% 20%, rgba(109, 185, 255, 0.28), transparent 32%), radial-gradient(circle at 82% 22%, rgba(157, 140, 255, 0.22), transparent 28%), linear-gradient(160deg, #0c1827 0%, #102032 45%, #13253a 100%)",
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
            {eyebrow}
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
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.04em",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#90b6ff" }}>
          Data engineering · delivery proof
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = `${input.slug}.png`;
  const filePath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });
  await Promise.all(
    (["jpg", "jpeg", "webp"] as const).map(async (candidate) => {
      try {
        await fs.unlink(path.join(outputDir, `${input.slug}.${candidate}`));
      } catch {
        // ignore
      }
    }),
  );
  await fs.writeFile(filePath, buffer);

  return {
    filePath,
    publicUrl: `${publicPrefix}/${fileName}`,
    model: "local-branded-og",
    bytes: buffer.byteLength,
  };
}
