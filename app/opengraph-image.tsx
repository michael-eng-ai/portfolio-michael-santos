import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
              fontSize: 26,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Data And AI Strategy
          </div>
          <div
            style={{
              display: "flex",
              borderRadius: 24,
              border: "1px solid rgba(190, 207, 230, 0.18)",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "18px 22px",
              fontSize: 30,
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
            maxWidth: 900,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.06em",
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              lineHeight: 1.35,
              color: "#dbeafe",
            }}
          >
            Business-facing insights on data engineering, AI, modern platforms,
            and execution that creates measurable growth.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              fontSize: 24,
              color: "#dce8fb",
            }}
          >
            <span>AI Strategy</span>
            <span>Data Platforms</span>
            <span>Execution Cases</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#90b6ff",
            }}
          >
            Senior Data Engineer
          </div>
        </div>
      </div>
    ),
    size,
  );
}
