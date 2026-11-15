import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDatabase } from "./data";
import type { Database } from "./data/types";

/**
 * Local demo persistence.
 *
 * The product ships with a PostgreSQL/Prisma schema (`prisma/schema.prisma`).
 * For a zero-infrastructure preview the same shape is persisted as a JSON
 * document under `.data/tectnal.json`, mutated through `mutateDb` which
 * serialises writes so concurrent server actions cannot interleave.
 */

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "tectnal.json");

let cache: Database | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

async function readFromDisk(): Promise<Database | null> {
  try {
    const raw = await readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Database;
    if (!parsed.version || !Array.isArray(parsed.users)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function persist(db: Database): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, DB_FILE);
}

export async function getDb(): Promise<Database> {
  if (cache) return cache;
  const existing = await readFromDisk();
  if (existing) {
    cache = existing;
    return cache;
  }
  const seeded = createDatabase();
  cache = seeded;
  await persist(seeded);
  return seeded;
}

/**
 * Serialised read-modify-write. Every mutation is queued so two server actions
 * never clobber each other's changes.
 */
export async function mutateDb<T>(mutator: (db: Database) => T | Promise<T>): Promise<T> {
  const run = writeChain.then(async () => {
    const db = await getDb();
    const result = await mutator(db);
    await persist(db);
    return result;
  });
  writeChain = run.catch(() => undefined);
  return run as Promise<T>;
}

/** Wipes the local store — used by the settings "reset demo data" action. */
export async function resetDb(): Promise<void> {
  cache = null;
  const fresh = createDatabase();
  cache = fresh;
  await persist(fresh);
}

export const DB_PATH = DB_FILE;
