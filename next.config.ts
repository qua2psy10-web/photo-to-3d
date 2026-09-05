import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure @google/model-viewer (and its peer three) are compiled by Next
  transpilePackages: ["@google/model-viewer"],
};

export default nextConfig;
