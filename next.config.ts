import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@google/model-viewer"],
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
