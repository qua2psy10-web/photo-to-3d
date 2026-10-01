import fs from "fs";
import path from "path";
import { MESSAGES } from "@/lib/messages";
import { isCancelRequested } from "./cancel";
import { defaultDetail, parseDetail } from "./detail";
import { reconstructJob } from "./worker";
import { jobWorkDir, writeProgress } from "./progress";

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    process.stderr.write("usage: worker-main.ts <jobId>\n");
    process.exit(2);
  }
  const inputFile = path.join(jobWorkDir(jobId), "input.json");
  const input = JSON.parse(fs.readFileSync(inputFile, "utf8")) as {
    imagePaths: string[];
    detail?: string;
  };
  const imagePaths = input.imagePaths;
  const detail = parseDetail(input.detail) ?? defaultDetail();
  process.once("SIGTERM", () => {
    writeProgress(jobId, {
      status: "failed",
      progress: 100,
      errorMessage: MESSAGES.fail_cancelled,
    });
    process.exit(0);
  });
  try {
    await reconstructJob(jobId, imagePaths, detail);
  } catch (err) {
    const message = isCancelRequested(jobId)
      ? MESSAGES.fail_cancelled
      : err instanceof Error
        ? err.message
        : "Photogrammetry failed.";
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
