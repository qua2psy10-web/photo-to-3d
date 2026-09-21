import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import { MAX_UPLOAD_BYTES } from "./src/lib/limits";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  transpilePackages: ["@google/model-viewer"],
  serverExternalPackages: ["@libsql/client"],
  // Auth middleware clones the request body (default 10MB). Phone photos
  // of 4+ shots exceed that and FormData parsing fails.
  experimental: {
    middlewareClientMaxBodySize: MAX_UPLOAD_BYTES,
  },
};

export default nextConfig;
