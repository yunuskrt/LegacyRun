import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The optimizer pulls `sharp` into the process, which breaks every
    // `next/og` render — see the share-card entry in context/current-feature.md.
    unoptimized: true,
  },
  // The share card reads the crests off disk, and `public/` is not traced into
  // a serverless bundle on its own — without this they deploy as initials.
  outputFileTracingIncludes: {
    "/api/share/card": ["./public/logos/**"],
  },
};

export default nextConfig;
