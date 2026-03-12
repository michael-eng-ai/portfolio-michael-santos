import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 48,
          background:
            "linear-gradient(135deg, #102032 0%, #14304b 46%, #223d63 100%)",
          color: "#f8fbff",
          fontSize: 86,
          fontWeight: 700,
          letterSpacing: "-0.08em",
        }}
      >
        MS
      </div>
    ),
    size,
  );
}
