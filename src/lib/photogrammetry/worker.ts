import { execFileSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/db";
import { MESSAGES } from "@/lib/messages";
import { localGlbPath } from "@/lib/model-store";
import { jobWorkDir, writeProgress } from "@/lib/photogrammetry/progress";

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

export async function runObjectCapture(opts: {
  jobId: string;
  imageDir: string;
  usdzPath: string;
  objPath: string;
}): Promise<void> {
  const bin = await ensureCliBuilt();
  const detail = process.env.PHOTOGRAMMETRY_DETAIL || "medium";
  await new Promise<void>((resolve, reject) => {
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
        const pct = parseProgressLine(line.trim());
        if (pct !== null) {
          writeProgress(opts.jobId, {
            status: "processing",
            progress: Math.max(8, pct),
            stage: pct < 45 ? "analyzing" : "meshing",
            pid: process.pid,
          });
        }
      }
    });
    let stderr = "";
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || MESSAGES.local_capture_failed));
    });
  });
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
  writeProgress(jobId, {
    status: "processing",
    progress: 2,
    stage: "preparing",
    pid: process.pid,
  });
  const work = jobWorkDir(jobId);
  const imageDir = await stageImages(jobId, imagePaths);
  writeProgress(jobId, {
    status: "processing",
    progress: 6,
    stage: "analyzing",
    pid: process.pid,
  });
  const usdzPath = path.join(work, "model.usdz");
  const objPath = path.join(work, "mesh", "model.obj");
  await runObjectCapture({ jobId, imageDir, usdzPath, objPath });
  writeProgress(jobId, {
    status: "processing",
    progress: 92,
    stage: "converting",
    pid: process.pid,
  });
  if (!fs.existsSync(objPath)) {
    throw new Error(MESSAGES.local_convert_failed);
  }
  prepareObjTextures(usdzPath, path.dirname(objPath));
  const glb = localGlbPath(jobId);
  await objToGlb(objPath, glb);
  if (!fs.existsSync(glb) || fs.statSync(glb).size < 100) {
    throw new Error(MESSAGES.local_convert_failed);
  }
  writeProgress(jobId, {
    status: "ready",
    progress: 100,
    stage: "done",
    modelPath: glb,
  });
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
