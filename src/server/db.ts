import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { createDatabase } from "./data";
import type { Database } from "./data/types";

/**
 * Local application persistence.
 *
 * The product ships with a PostgreSQL/Prisma schema (`prisma/schema.prisma`).
 * For a zero-infrastructure preview the same shape is persisted as a JSON
 * document under `.data/tectnal.json`, mutated through `mutateDb` which
 * serialises writes so concurrent server actions cannot interleave.
 */

const DB_DIR = process.env.TECTNAL_DATA_DIR || path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "tectnal.json");

let cache: Database | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

const globalForPrisma = globalThis as typeof globalThis & { tectnalPrisma?: PrismaClient };
const prisma =
  globalForPrisma.tectnalPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.tectnalPrisma = prisma;

const DATABASE_STATE_KEY = "tectnal:application-state";
const usesNeon = () => process.env.DATABASE_PROVIDER === "neon" && Boolean(process.env.DATABASE_URL);

async function readFromDisk(): Promise<Database | null> {
  try {
    const raw = await readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Database;
    if (parsed.version !== 2 || !Array.isArray(parsed.users)) return null;
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

function readDatabaseState(value: Prisma.JsonValue | null | undefined): Database | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as unknown as Database;
  return candidate.version === 2 && Array.isArray(candidate.users) ? candidate : null;
}

async function ensureNeonState(): Promise<Database> {
  const existing = await prisma.setting.findUnique({ where: { key: DATABASE_STATE_KEY } });
  const existingState = readDatabaseState(existing?.value);
  if (existingState) return existingState;

  const initial = createDatabase();
  const row = await prisma.setting.upsert({
    where: { key: DATABASE_STATE_KEY },
    update: { value: initial as unknown as Prisma.InputJsonValue },
    create: { key: DATABASE_STATE_KEY, value: initial as unknown as Prisma.InputJsonValue },
  });
  const state = readDatabaseState(row.value);
  if (!state) throw new Error("حالة قاعدة بيانات تكتنال غير صالحة");
  return state;
}

async function mutateNeonState<T>(mutator: (db: Database) => T | Promise<T>): Promise<T> {
  await ensureNeonState();

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ key: string }>>`
      SELECT "key" FROM "Setting" WHERE "key" = ${DATABASE_STATE_KEY} FOR UPDATE
    `;
    const row = await transaction.setting.findUnique({ where: { key: DATABASE_STATE_KEY } });
    const db = readDatabaseState(row?.value);
    if (!db) throw new Error("تعذر قراءة حالة قاعدة بيانات تكتنال");

    const result = await mutator(db);
    await transaction.setting.update({
      where: { key: DATABASE_STATE_KEY },
      data: { value: db as unknown as Prisma.InputJsonValue },
    });
    return result;
  });
}

export async function getDb(): Promise<Database> {
  if (usesNeon()) return ensureNeonState();
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
    if (usesNeon()) return mutateNeonState(mutator);
    const db = await getDb();
    const result = await mutator(db);
    await persist(db);
    return result;
  });
  writeChain = run.catch(() => undefined);
  return run as Promise<T>;
}

export const DB_PATH = DB_FILE;
