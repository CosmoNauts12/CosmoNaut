import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    turbopack: {
      root: '.',
    },
  },
};

export default nextConfig;
