import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/db";
import type { ProviderTaskStatus } from "@/lib/providers/types";

export type ProgressFile = {
  status: ProviderTaskStatus;
  progress: number;
  stage?: string;
  errorMessage?: string;
  pid?: number;
  modelPath?: string;
  updatedAt: string;
};

export function jobWorkDir(jobId: string): string {
  const dir = path.join(getDataDir(), "work", jobId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function progressPath(jobId: string): string {
  return path.join(jobWorkDir(jobId), "progress.json");
}

export function writeProgress(jobId: string, data: Omit<ProgressFile, "updatedAt">): ProgressFile {
  const full: ProgressFile = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  const dest = progressPath(jobId);
  const tmp = `${dest}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(full, null, 2), "utf8");
  fs.renameSync(tmp, dest);
  return full;
}

export function readProgress(jobId: string): ProgressFile | null {
  const dest = progressPath(jobId);
  if (!fs.existsSync(dest)) return null;
  try {
    return JSON.parse(fs.readFileSync(dest, "utf8")) as ProgressFile;
  } catch {
    return null;
  }
}

export function isPidAlive(pid: number | undefined): boolean {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
