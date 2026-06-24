import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        pathname: "/**",
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        port: "3001",
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
