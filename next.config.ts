import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  transpilePackages: ["@google/model-viewer"],
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
