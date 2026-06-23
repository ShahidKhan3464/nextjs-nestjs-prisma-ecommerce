import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 56,
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
