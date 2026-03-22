import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["convex", "@ping/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
