import pg from 'pg';
const { Pool } = pg;

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function buildPoolOptions(env = process.env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const sslMode = String(env.DATABASE_SSL || '').toLowerCase();
  // Verify database TLS certificates by default. Prefer DATABASE_CA for private CAs;
  // only disable TLS or certificate verification through explicit environment settings.
  const rejectUnauthorized = String(env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? 'true').toLowerCase() === 'true';
  const ssl = sslMode === 'false'
    ? false
    : { rejectUnauthorized, ...(env.DATABASE_CA ? { ca: env.DATABASE_CA } : {}) };

  return {
    connectionString: env.DATABASE_URL,
    max: positiveInteger(env.DB_POOL_SIZE, 5, 'DB_POOL_SIZE'),
    idleTimeoutMillis: positiveInteger(env.DB_IDLE_TIMEOUT_MS, 10_000, 'DB_IDLE_TIMEOUT_MS'),
    connectionTimeoutMillis: positiveInteger(env.DB_CONNECTION_TIMEOUT_MS, 5_000, 'DB_CONNECTION_TIMEOUT_MS'),
    statement_timeout: positiveInteger(env.DB_STATEMENT_TIMEOUT_MS, 15_000, 'DB_STATEMENT_TIMEOUT_MS'),
    query_timeout: positiveInteger(env.DB_QUERY_TIMEOUT_MS, 20_000, 'DB_QUERY_TIMEOUT_MS'),
    idle_in_transaction_session_timeout: positiveInteger(env.DB_IDLE_TRANSACTION_TIMEOUT_MS, 10_000, 'DB_IDLE_TRANSACTION_TIMEOUT_MS'),
    application_name: env.DB_APPLICATION_NAME || 'enjaz-api',
    ssl,
  };
}

let pool;
export function getPool() {
  if (!pool) pool = new Pool(buildPoolOptions());
  return pool;
}
export async function query(text, params = []) {
  return getPool().query(text, params);
}
export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    try { await client.query('rollback'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
