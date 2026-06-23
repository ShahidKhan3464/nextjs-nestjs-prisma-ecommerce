import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 14,
        width: "100%",
        height: "100%",
        display: "flex",
        fontWeight: 700,
        color: "#fafaf9",
        alignItems: "center",
        background: "#1c1917",
        justifyContent: "center",
        letterSpacing: "-0.04em",
      }}
    >
      AC
    </div>,
    { ...size }
  );
}
