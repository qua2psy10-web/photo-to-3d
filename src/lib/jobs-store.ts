import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { ensureSchema, getDataDir } from "@/lib/db";
import { getReconstructionProvider } from "@/lib/providers";
import type { Job, JobImage, JobStatus } from "@/lib/types";
import { DEMO_MODEL_URL } from "@/lib/types";

type JobRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  image_count: number;
  model_url: string | null;
  error_message: string | null;
  simulate_fail: number;
  provider: string | null;
  provider_task_id: string | null;
};

type ImageRow = {
  id: string;
  job_id: string;
  path: string;
  original_name: string;
  mime_type: string;
  size: number;
  sort_order: number;
};

function rowToJob(row: JobRow, images: ImageRow[]): Job {
  return {
    id: row.id,
    status: row.status as JobStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    imageCount: row.image_count,
    imagePaths: images
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.path),
    ...(row.model_url ? { modelUrl: row.model_url } : {}),
    ...(row.error_message ? { errorMessage: row.error_message } : {}),
    ...(row.simulate_fail ? { simulateFail: true } : {}),
    ...(row.provider ? { provider: row.provider } : {}),
    ...(row.provider_task_id ? { providerTaskId: row.provider_task_id } : {}),
  };
}

async function loadImages(jobId: string): Promise<ImageRow[]> {
  const db = await ensureSchema();
  const res = await db.execute({
    sql: "SELECT * FROM job_images WHERE job_id = ? ORDER BY sort_order ASC",
    args: [jobId],
  });
  return res.rows as unknown as ImageRow[];
}

async function loadJobRow(id: string): Promise<JobRow | null> {
  const db = await ensureSchema();
  const res = await db.execute({
    sql: "SELECT * FROM jobs WHERE id = ?",
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return res.rows[0] as unknown as JobRow;
}

async function persistJobUpdate(job: Job): Promise<void> {
  const db = await ensureSchema();
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE jobs SET
      status = ?,
      updated_at = ?,
      model_url = ?,
      error_message = ?,
      provider_task_id = ?
      WHERE id = ?`,
    args: [
      job.status,
      now,
      job.modelUrl ?? null,
      job.errorMessage ?? null,
      job.providerTaskId ?? null,
      job.id,
    ],
  });
}

/** Advance via provider getTask and persist terminal/status changes. */
export async function advanceJob(job: Job): Promise<Job> {
  if (
    job.status === "ready" ||
    job.status === "failed" ||
    job.status === "completed"
  ) {
    return job;
  }

  const provider = getReconstructionProvider();
  const result = await provider.getTask(job);

  let next: Job = job;
  if (result.status === "ready") {
    next = {
      ...job,
      status: "ready",
      modelUrl: result.modelUrl ?? DEMO_MODEL_URL,
      errorMessage: undefined,
      providerTaskId: result.providerTaskId ?? job.providerTaskId,
    };
  } else if (result.status === "failed") {
    next = {
      ...job,
      status: "failed",
      modelUrl: undefined,
      errorMessage: result.errorMessage,
      providerTaskId: result.providerTaskId ?? job.providerTaskId,
    };
  } else if (result.status === "processing" && job.status !== "processing") {
    next = {
      ...job,
      status: "processing",
      providerTaskId: result.providerTaskId ?? job.providerTaskId,
    };
  } else if (result.status === "queued" && job.status !== "queued") {
    next = {
      ...job,
      status: "queued",
      providerTaskId: result.providerTaskId ?? job.providerTaskId,
    };
  } else if (
    result.providerTaskId &&
    result.providerTaskId !== job.providerTaskId
  ) {
    next = { ...job, providerTaskId: result.providerTaskId };
  }

  if (next !== job) {
    await persistJobUpdate(next);
    next = { ...next, updatedAt: new Date().toISOString() };
  }
  return next;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const row = await loadJobRow(id);
  if (!row) return undefined;
  const images = await loadImages(id);
  const job = rowToJob(row, images);
  return advanceJob(job);
}

export async function listJobs(): Promise<Job[]> {
  const db = await ensureSchema();
  const res = await db.execute(
    "SELECT * FROM jobs ORDER BY created_at DESC",
  );
  const jobs: Job[] = [];
  for (const row of res.rows as unknown as JobRow[]) {
    const images = await loadImages(row.id);
    const job = rowToJob(row, images);
    jobs.push(await advanceJob(job));
  }
  return jobs;
}

export type CreateJobInput = {
  files: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  }[];
  simulateFail?: boolean;
};

function extensionFor(name: string, mime: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".gif")) return ".gif";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".bin";
}

function mimeFromExt(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const db = await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const provider = getReconstructionProvider();
  const simulateFail =
    input.simulateFail ??
    (provider.name === "dummy" && Math.random() < 0.05);

  const uploadDir = path.join(getDataDir(), "uploads", id);
  fs.mkdirSync(uploadDir, { recursive: true });

  const imageRows: ImageRow[] = [];
  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i];
    const ext = extensionFor(file.originalName, file.mimeType);
    const filename = `${String(i).padStart(3, "0")}${ext}`;
    const abs = path.join(uploadDir, filename);
    fs.writeFileSync(abs, file.buffer);
    const rel = path.join("uploads", id, filename).replace(/\\/g, "/");
    imageRows.push({
      id: randomUUID(),
      job_id: id,
      path: rel,
      original_name: file.originalName,
      mime_type: file.mimeType || "application/octet-stream",
      size: file.buffer.length,
      sort_order: i,
    });
  }

  const imagePaths = imageRows.map((r) => r.path);

  async function insertImages() {
    for (const img of imageRows) {
      await db.execute({
        sql: `INSERT INTO job_images (id, job_id, path, original_name, mime_type, size, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          img.id,
          img.job_id,
          img.path,
          img.original_name,
          img.mime_type,
          img.size,
          img.sort_order,
        ],
      });
    }
  }

  let providerTaskId: string | undefined;
  try {
    const created = await provider.createTask({
      jobId: id,
      imagePaths: imagePaths.map((p) => path.join(getDataDir(), p)),
      simulateFail,
      createdAt,
    });
    providerTaskId = created.providerTaskId;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Provider failed to create task";
    await db.execute({
      sql: `INSERT INTO jobs (id, status, created_at, updated_at, image_count, model_url, error_message, simulate_fail, provider, provider_task_id)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL)`,
      args: [
        id,
        "failed",
        createdAt,
        createdAt,
        imageRows.length,
        message,
        simulateFail ? 1 : 0,
        provider.name,
      ],
    });
    await insertImages();
    return {
      id,
      status: "failed",
      createdAt,
      updatedAt: createdAt,
      imageCount: imageRows.length,
      imagePaths,
      errorMessage: message,
      provider: provider.name,
      ...(simulateFail ? { simulateFail: true } : {}),
    };
  }

  await db.execute({
    sql: `INSERT INTO jobs (id, status, created_at, updated_at, image_count, model_url, error_message, simulate_fail, provider, provider_task_id)
          VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
    args: [
      id,
      "queued",
      createdAt,
      createdAt,
      imageRows.length,
      simulateFail ? 1 : 0,
      provider.name,
      providerTaskId ?? null,
    ],
  });
  await insertImages();

  return {
    id,
    status: "queued",
    createdAt,
    updatedAt: createdAt,
    imageCount: imageRows.length,
    imagePaths,
    provider: provider.name,
    providerTaskId,
    ...(simulateFail ? { simulateFail: true } : {}),
  };
}

/** Retry: create a new job by copying images from an existing job. */
export async function retryJob(sourceJobId: string): Promise<Job | null> {
  const source = await getJob(sourceJobId);
  if (!source) return null;

  const files: CreateJobInput["files"] = [];
  for (const rel of source.imagePaths) {
    const abs = path.join(getDataDir(), rel);
    if (!fs.existsSync(abs)) continue;
    const buffer = fs.readFileSync(abs);
    const originalName = path.basename(rel);
    const mimeType = mimeFromExt(originalName);
    files.push({ buffer, originalName, mimeType });
  }
  if (files.length === 0) {
    throw new Error("No stored images available to retry");
  }
  return createJob({ files, simulateFail: false });
}

export async function jobProgressPercent(job: Job): Promise<number> {
  const provider = getReconstructionProvider();
  const result = await provider.getTask(job);
  return result.progress;
}

export async function getJobImages(jobId: string): Promise<JobImage[]> {
  const rows = await loadImages(jobId);
  return rows.map((r) => ({
    id: r.id,
    jobId: r.job_id,
    path: r.path,
    originalName: r.original_name,
    mimeType: r.mime_type,
    size: r.size,
    sortOrder: r.sort_order,
  }));
}

export function absoluteImagePath(relPath: string): string {
  const base = getDataDir();
  const abs = path.resolve(base, relPath);
  if (!abs.startsWith(path.resolve(base))) {
    throw new Error("Invalid image path");
  }
  return abs;
}
