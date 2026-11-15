import pg, { type PoolClient } from 'pg';
import { env } from './config.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 8,
  connectionTimeoutMillis: 12_000,
  idleTimeoutMillis: 15_000,
  query_timeout: 15_000,
});

export async function transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await run(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
