import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/db";
import { DEMO_MODEL_URL } from "@/lib/types";

export function getModelsDir(): string {
  const dir = path.join(getDataDir(), "models");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function localGlbPath(jobId: string): string {
  return path.join(getModelsDir(), `${jobId}.glb`);
}

export function publicModelUrl(jobId: string): string {
  return `/api/jobs/${jobId}/model`;
}

export function demoGlbSourcePath(): string {
  return path.join(process.cwd(), "public", "samples", "demo.glb");
}

/**
 * Copy the dummy demo GLB (or an existing local file) into data/models.
 * Returns the authenticated app URL for model-viewer.
 */
export function ensureLocalGlb(jobId: string, sourceUrl?: string): string {
  const dest = localGlbPath(jobId);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    return publicModelUrl(jobId);
  }

  const src =
    !sourceUrl ||
    sourceUrl === DEMO_MODEL_URL ||
    sourceUrl.startsWith("/api/jobs/")
      ? demoGlbSourcePath()
      : sourceUrl.startsWith("/")
        ? path.join(process.cwd(), "public", sourceUrl.replace(/^\//, ""))
        : demoGlbSourcePath();

  if (!fs.existsSync(src)) {
    throw new Error(`Demo GLB is missing at ${src}`);
  }
  fs.copyFileSync(src, dest);
  return publicModelUrl(jobId);
}

export function readLocalGlb(
  jobId: string,
): { buffer: Buffer; exists: boolean } {
  const dest = localGlbPath(jobId);
  if (fs.existsSync(dest)) {
    return { buffer: fs.readFileSync(dest), exists: true };
  }
  return { buffer: Buffer.alloc(0), exists: false };
}
