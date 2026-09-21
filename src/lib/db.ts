import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";

let client: Client | null = null;
let migrated = false;
let boundDir: string | null = null;

export function getDataDir(): string {
  const dir = process.env.PHOTO_TO_3D_DATA_DIR
    ? path.resolve(process.env.PHOTO_TO_3D_DATA_DIR)
    : path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, "uploads"), { recursive: true });
  fs.mkdirSync(path.join(dir, "models"), { recursive: true });
  return dir;
}

export function resetDbForTests(): void {
  client = null;
  migrated = false;
  boundDir = null;
}

export function getDb(): Client {
  const dir = getDataDir();
  if (!client || boundDir !== dir) {
    boundDir = dir;
    migrated = false;
    const dbPath = path.join(dir, "photo-to-3d.db");
    client = createClient({
      url: `file:${dbPath}`,
    });
  }
  return client;
}

export async function ensureSchema(): Promise<Client> {
  const db = getDb();
  if (migrated) return db;

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      image_count INTEGER NOT NULL DEFAULT 0,
      model_url TEXT,
      error_message TEXT,
      simulate_fail INTEGER NOT NULL DEFAULT 0,
      provider TEXT,
      provider_task_id TEXT
    );

    CREATE TABLE IF NOT EXISTS job_images (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_job_images_job_id ON job_images(job_id);
  `);

  migrated = true;
  return db;
}
