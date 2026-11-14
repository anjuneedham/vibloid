import pg from "pg";

let pool: pg.Pool | undefined;

export function getPool(url = process.env.DATABASE_URL): pg.Pool {
  if (!pool) {
    if (!url) throw new Error("DATABASE_URL is not set");
    // Neon requires TLS; local test databases usually do not.
    const ssl = /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
    pool = new pg.Pool({ connectionString: url, ssl, max: 10 });
  }
  return pool;
}

export async function closePool() {
  await pool?.end();
  pool = undefined;
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params);
}
