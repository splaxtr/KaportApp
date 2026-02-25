import { PrismaPg } from "@prisma/adapter-pg";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client") as { PrismaClient: new (opts: unknown) => PrismaClientInstance };
import { Pool } from "pg";

/** Minimal interface so the rest of the codebase gets autocomplete-free but type-safe access. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientInstance = Record<string, any> & {
  $transaction: (...args: unknown[]) => Promise<unknown>;
  $disconnect: () => Promise<void>;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClientInstance;
};

// Reuse pool and client in dev to avoid exhausting DB connections during HMR.
const pool = globalForPrisma.pool ?? new Pool({ connectionString });
const prisma: PrismaClientInstance =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
  globalForPrisma.prisma = prisma;
}

export { prisma };
