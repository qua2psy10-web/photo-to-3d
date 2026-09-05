import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "photo-to-3d.db");

let client: Client | null = null;
let migrated = false;

export function getDataDir(): string {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "uploads"), { recursive: true });
  return DATA_DIR;
}

export function getDb(): Client {
  if (!client) {
    getDataDir();
    client = createClient({
      url: `file:${DB_PATH}`,
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
