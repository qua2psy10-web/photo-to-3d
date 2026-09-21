import fs from "fs";
import path from "path";
import { reconstructJob } from "./worker";
import { jobWorkDir, writeProgress } from "./progress";

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    process.stderr.write("usage: worker-main.ts <jobId>\n");
    process.exit(2);
  }
  const inputFile = path.join(jobWorkDir(jobId), "input.json");
  const imagePaths = (
    JSON.parse(fs.readFileSync(inputFile, "utf8")) as { imagePaths: string[] }
  ).imagePaths;
  try {
    await reconstructJob(jobId, imagePaths);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Photogrammetry failed.";
    writeProgress(jobId, {
      status: "failed",
      progress: 100,
      errorMessage: message,
    });
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

void main();
