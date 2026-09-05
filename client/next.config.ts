import type { NextConfig } from "next";

const uploadHost = process.env.NEXT_PUBLIC_UPLOADS_HOST?.trim() || "localhost";
const uploadProtocol =
  process.env.NEXT_PUBLIC_UPLOADS_PROTOCOL === "https" ? "https" : "http";
const uploadPort = process.env.NEXT_PUBLIC_UPLOADS_PORT?.trim();

const uploadPattern: {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
} = {
  protocol: uploadProtocol,
  hostname: uploadHost,
  pathname: "/uploads/**",
};

if (uploadPort) {
  uploadPattern.port = uploadPort;
} else if (uploadHost === "localhost") {
  uploadPattern.port = "3001";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        pathname: "/**",
        protocol: "https",
        hostname: "picsum.photos",
      },
      uploadPattern,
    ],
  },
};

export default nextConfig;
