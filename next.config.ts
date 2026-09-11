import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The optimizer pulls `sharp` into the process, which breaks every
    // `next/og` render — see the share-card entry in context/current-feature.md.
    unoptimized: true,
  },
};

export default nextConfig;
