/**
 * Standalone deployment migration runner.
 *
 * Usage:
 *   pnpm run migration:deploy
 *
 * Run this as a pre-deploy / release command on Render, Railway, Fly.io, etc.
 * before starting the API server so that all pending TypeORM migrations are
 * applied to the database.
 *
 * The script exits with code 0 on success and code 1 on failure, making it
 * safe to use in CI/CD pipelines.
 *
 * Cold-start aware: Neon (and other serverless Postgres providers) suspend
 * their compute when idle. This script retries the connection up to
 * MAX_RETRIES times with an exponential back-off so that the DB has time to
 * wake up before we give up.
 */

import { join } from "path";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config({ path: join(__dirname, "../../../.env") });

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 3_000; // 3 s → 6 s → 12 s → 24 s → 48 s

/**
 * Strip query params that node-postgres does not support (e.g. channel_binding,
 * sslmode) so the driver does not hang waiting for features it cannot negotiate.
 * SSL is handled via the TypeORM `ssl` option instead.
 */
function sanitizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return raw;
  }
}

function sleep(ms: number) {
  // eslint-disable-next-line no-undef
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(dataSource: DataSource): Promise<void> {
  let lastErr: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔌 Connection attempt ${attempt}/${MAX_RETRIES}...`);
      await dataSource.initialize();
      return; // success
    } catch (err) {
      lastErr = err as Error;
      // eslint-disable-next-line no-undef
      const code = (err as NodeJS.ErrnoException).code ?? "";
      const isTransient =
        code === "ETIMEDOUT" ||
        code === "ECONNRESET" ||
        code === "ECONNREFUSED" ||
        err.message?.includes("ETIMEDOUT") ||
        err.message?.includes("AggregateError");

      if (!isTransient || attempt === MAX_RETRIES) break;

      const delay = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
      console.log(
        `⚠️  ${code || err.message} – retrying in ${delay / 1000}s (DB may be waking up)...`,
      );
      await sleep(delay);
    }
  }

  throw lastErr;
}

async function runMigrations() {
  const rawUrl = process.env.DATABASE_URL;
  const dbUrl = sanitizeDbUrl(rawUrl);

  if (!dbUrl && !process.env.DB_HOST) {
    console.error(
      "❌ No database connection configured. Set DATABASE_URL or DB_* env vars.",
    );
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: "postgres",
    url: dbUrl,
    host: dbUrl ? undefined : process.env.DB_HOST,
    port: dbUrl ? undefined : parseInt(process.env.DB_PORT, 10) || 5432,
    username: dbUrl ? undefined : process.env.DB_USERNAME,
    password: dbUrl ? undefined : process.env.DB_PASSWORD,
    database: dbUrl ? undefined : process.env.DB_NAME,
    ssl: dbUrl ? { rejectUnauthorized: false } : process.env.DB_SSL === "true",
    // Per-attempt connection timeout.  The retry loop will wait up to
    // MAX_RETRIES × (30 s + back-off) for a cold-start to complete.
    connectTimeoutMS: 30_000,
    entities: [
      join(
        __dirname,
        "../../../libs/database/src/entities/**/*.entity.{ts,js}",
      ),
    ],
    migrations: [
      join(__dirname, "../../../libs/database/src/migrations/**/*.{ts,js}"),
    ],
    // Show SQL so deployment logs capture exactly what ran.
    logging: ["migration", "error"],
  });

  try {
    await connectWithRetry(dataSource);
    console.log("✅ Database connected");

    const hasPending = await dataSource.showMigrations();
    if (!hasPending) {
      console.log("✅ No pending migrations – database is up-to-date");
      await dataSource.destroy();
      process.exit(0);
    }

    console.log("📋 Running pending migrations...");
    const executed = await dataSource.runMigrations({ transaction: "each" });
    console.log(`✅ Applied ${executed.length} migration(s):`);
    executed.forEach((m) => console.log(`   • ${m.name}`));

    await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    if (err.stack) console.error(err.stack);
    try {
      await dataSource.destroy();
    } catch {
      // ignore cleanup errors
    }
    process.exit(1);
  }
}

runMigrations();
