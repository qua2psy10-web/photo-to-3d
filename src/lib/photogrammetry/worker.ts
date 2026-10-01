import { execFileSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/db";
import { isCancelRequested } from "@/lib/photogrammetry/cancel";
import { explainCaptureFailure } from "@/lib/photogrammetry/explain";
import { MESSAGES } from "@/lib/messages";
import { localGlbPath } from "@/lib/model-store";
import { jobWorkDir, writeProgress } from "@/lib/photogrammetry/progress";
import {
  applyCaptureLine,
  beginStage,
  moveStage,
  type StageSnapshot,
} from "@/lib/photogrammetry/stages";
import type { ProviderTaskStatus } from "@/lib/providers/types";

export function cliPackageDir(): string {
  return path.join(process.cwd(), "tools", "object-capture");
}

export function cliBinaryPath(): string {
  const pkg = cliPackageDir();
  const candidates = [
    path.join(pkg, ".build", "release", "object-capture"),
    path.join(pkg, ".build", "arm64-apple-macosx", "release", "object-capture"),
    path.join(pkg, ".build", "out", "Products", "Release", "object-capture"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const buildRoot = path.join(pkg, ".build");
  if (fs.existsSync(buildRoot)) {
    const found = findFileNamed(buildRoot, "object-capture", 6);
    if (found) return found;
  }
  return candidates[0];
}

function findFileNamed(dir: string, name: string, depth: number): string | null {
  if (depth < 0) return null;
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry);
    let st: fs.Stats;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isFile() && entry === name && st.size > 10_000) return p;
    if (st.isDirectory()) {
      const hit = findFileNamed(p, name, depth - 1);
      if (hit) return hit;
    }
  }
  return null;
}

function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b: Buffer) => {
      stdout += b.toString("utf8");
    });
    child.stderr.on("data", (b: Buffer) => {
      stderr += b.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else {
        reject(
          new Error(
            stderr.trim() || stdout.trim() || `${cmd} exited ${code}`,
          ),
        );
      }
    });
  });
}

export async function ensureCliBuilt(): Promise<string> {
  const bin = cliBinaryPath();
  if (fs.existsSync(bin)) return bin;
  const pkg = cliPackageDir();
  if (!fs.existsSync(path.join(pkg, "Package.swift"))) {
    throw new Error(MESSAGES.local_cli_missing);
  }
  await run("swift", ["build", "-c", "release"], { cwd: pkg });
  if (!fs.existsSync(bin)) {
    throw new Error(MESSAGES.local_cli_missing);
  }
  return bin;
}

function convertToJpeg(src: string, dest: string): Promise<void> {
  return run("sips", ["-s", "format", "jpeg", src, "--out", dest]).then(() => undefined);
}

export async function stageImages(
  jobId: string,
  imagePaths: string[],
): Promise<string> {
  const staging = path.join(jobWorkDir(jobId), "images");
  fs.mkdirSync(staging, { recursive: true });
  const dataDir = getDataDir();
  let i = 0;
  for (const rel of imagePaths) {
    const abs = path.isAbsolute(rel) ? rel : path.join(dataDir, rel);
    if (!fs.existsSync(abs)) continue;
    const ext = path.extname(abs).toLowerCase();
    const destName = `${String(i).padStart(3, "0")}`;
    if (ext === ".webp" || ext === ".gif") {
      await convertToJpeg(abs, path.join(staging, `${destName}.jpg`));
    } else {
      const outExt = ext === ".jpeg" ? ".jpg" : ext || ".jpg";
      fs.copyFileSync(abs, path.join(staging, `${destName}${outExt}`));
    }
    i += 1;
  }
  if (i < 2) {
    throw new Error(MESSAGES.local_too_few_views);
  }
  return staging;
}

function noteCaptureEvent(
  line: string,
  stats: { invalid: number; skipped: number },
  notes: string[],
): void {
  try {
    const ev = JSON.parse(line) as {
      event?: string;
      reason?: string;
      message?: string;
    };
    if (ev.event === "invalidSample") {
      stats.invalid += 1;
      if (ev.reason) notes.push(String(ev.reason));
    } else if (ev.event === "skippedSample") {
      stats.skipped += 1;
    } else if (ev.event === "stitchingIncomplete") {
      notes.push("stitching incomplete overlap");
    } else if (ev.event === "error" && ev.message) {
      notes.push(String(ev.message));
    }
  } catch {
    /* not JSON */
  }
}

function parseProgressLine(line: string): number | null {
  try {
    const ev = JSON.parse(line) as { event?: string; fraction?: number };
    if (ev.event === "progress" && typeof ev.fraction === "number") {
      return Math.max(0, Math.min(99, Math.round(ev.fraction * 100)));
    }
  } catch {
    /* ignore non-JSON */
  }
  return null;
}

function publishLive(
  jobId: string,
  status: ProviderTaskStatus,
  progress: number,
  live: StageSnapshot,
  extra: { modelPath?: string; pid?: number } = {},
): void {
  if (isCancelRequested(jobId)) return;
  writeProgress(jobId, {
    status,
    progress,
    stage: live.stage,
    activity: live.activity,
    log: live.log,
    ...extra,
  });
}

export async function runObjectCapture(opts: {
  jobId: string;
  imageDir: string;
  usdzPath: string;
  objPath: string;
  live: StageSnapshot;
}): Promise<StageSnapshot> {
  const bin = await ensureCliBuilt();
  if (isCancelRequested(opts.jobId)) {
    throw new Error(MESSAGES.fail_cancelled);
  }
  const detail = process.env.PHOTOGRAMMETRY_DETAIL || "medium";
  const stats = { invalid: 0, skipped: 0 };
  const notes: string[] = [];
  let live = opts.live;
  let lastPct = 8;
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const succeed = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };
    const child = spawn(
      bin,
      [
        "--input",
        opts.imageDir,
        "--output",
        opts.usdzPath,
        "--obj",
        opts.objPath,
        "--detail",
        detail,
      ],
      { env: process.env },
    );
    let buf = "";
    child.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (isCancelRequested(opts.jobId)) {
          child.kill("SIGKILL");
          fail(new Error(MESSAGES.fail_cancelled));
          return;
        }
        const pct = parseProgressLine(trimmed);
        const next = applyCaptureLine(live, trimmed);
        if (pct !== null) lastPct = Math.max(lastPct, pct);
        if (pct !== null || next !== live) {
          live = next;
          publishLive(opts.jobId, "processing", lastPct, live, { pid: process.pid });
        }
        noteCaptureEvent(trimmed, stats, notes);
      }
    });
    let stderr = "";
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString("utf8");
    });
    child.on("error", (err) => fail(err));
    child.on("close", (code) => {
      if (isCancelRequested(opts.jobId)) {
        fail(new Error(MESSAGES.fail_cancelled));
        return;
      }
      if (code === 0) succeed();
      else {
        const raw = [stderr.trim(), ...notes].filter(Boolean).join("\n");
        fail(new Error(explainCaptureFailure(raw, stats)));
      }
    });
  });
  return live;
}

export function rewriteMtlTextureRefs(mtl: string): string {
  return mtl.replace(/\S+\.usdz\[([^\]]+)\]/g, (_m, inner: string) =>
    path.basename(String(inner).replace(/\\/g, "/")),
  );
}

function copyPngsRecursive(dir: string, dest: string): void {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) copyPngsRecursive(p, dest);
    else if (name.toLowerCase().endsWith(".png")) {
      fs.copyFileSync(p, path.join(dest, name));
    }
  }
}

/** ModelIO writes map_Kd as `model.usdz[0/tex.png]`. Unpack USDZ so obj2gltf can find PNGs. */
export function prepareObjTextures(usdzPath: string, objDir: string): void {
  const unpack = path.join(objDir, "_usdz");
  fs.mkdirSync(unpack, { recursive: true });
  execFileSync("unzip", ["-o", usdzPath, "-d", unpack], { stdio: "pipe" });
  copyPngsRecursive(unpack, objDir);
  const mtlPath = path.join(objDir, "model.mtl");
  if (!fs.existsSync(mtlPath)) return;
  const rewritten = rewriteMtlTextureRefs(fs.readFileSync(mtlPath, "utf8"));
  fs.writeFileSync(mtlPath, rewritten);
}

export async function objToGlb(objPath: string, glbPath: string): Promise<void> {
  const obj2gltf = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    "obj2gltf",
  );
  if (!fs.existsSync(obj2gltf) && !fs.existsSync(`${obj2gltf}.cmd`)) {
    throw new Error(MESSAGES.local_convert_failed);
  }
  fs.mkdirSync(path.dirname(glbPath), { recursive: true });
  await run(obj2gltf, ["-i", objPath, "-o", glbPath], {
    cwd: path.dirname(objPath),
  });
}

export async function reconstructJob(jobId: string, imagePaths: string[]): Promise<void> {
  if (isCancelRequested(jobId)) throw new Error(MESSAGES.fail_cancelled);
  let live = beginStage("preparing");
  publishLive(jobId, "processing", 2, live, { pid: process.pid });
  const work = jobWorkDir(jobId);
  const imageDir = await stageImages(jobId, imagePaths);
  live = moveStage(live, "analyzing");
  publishLive(jobId, "processing", 6, live, { pid: process.pid });
  const usdzPath = path.join(work, "model.usdz");
  const objPath = path.join(work, "mesh", "model.obj");
  live = await runObjectCapture({ jobId, imageDir, usdzPath, objPath, live });
  if (isCancelRequested(jobId)) throw new Error(MESSAGES.fail_cancelled);
  live = moveStage(live, "converting");
  publishLive(jobId, "processing", 92, live, { pid: process.pid });
  if (!fs.existsSync(objPath)) {
    throw new Error(MESSAGES.local_convert_failed);
  }
  prepareObjTextures(usdzPath, path.dirname(objPath));
  const glb = localGlbPath(jobId);
  await objToGlb(objPath, glb);
  if (!fs.existsSync(glb) || fs.statSync(glb).size < 100) {
    throw new Error(MESSAGES.local_convert_failed);
  }
  live = moveStage(live, "done");
  publishLive(jobId, "ready", 100, live, { modelPath: glb });
}

export function spawnWorker(jobId: string, imagePaths: string[]): number {
  const work = jobWorkDir(jobId);
  const inputFile = path.join(work, "input.json");
  fs.writeFileSync(inputFile, JSON.stringify({ jobId, imagePaths }), "utf8");
  const workerFile = path.join(
    process.cwd(),
    "src",
    "lib",
    "photogrammetry",
    "worker-main.ts",
  );
  const tsx = path.join(process.cwd(), "node_modules", ".bin", "tsx");
  const log = path.join(work, "worker.log");
  const out = fs.openSync(log, "a");
  const child = spawn(tsx, [workerFile, jobId], {
    cwd: process.cwd(),
    detached: true,
    stdio: ["ignore", out, out],
    env: {
      ...process.env,
      PHOTO_TO_3D_DATA_DIR: getDataDir(),
    },
  });
  child.unref();
  return child.pid ?? 0;
}
