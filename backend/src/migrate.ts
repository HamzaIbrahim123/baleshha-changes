import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { pool } from './db.js';

const directory=resolve(dirname(fileURLToPath(import.meta.url)),'../migrations');
const client=await pool.connect();
try {
  await client.query('SELECT pg_advisory_lock(517342005)');
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  for(const filename of (await readdir(directory)).filter(x=>/^\d+_.*\.sql$/.test(x)).sort()) {
    const raw=await readFile(resolve(directory,filename),'utf8');
    const checksum=createHash('sha256').update(raw).digest('hex');
    const prev=await client.query<{checksum:string}>(
      'SELECT checksum FROM schema_migrations WHERE filename=$1',[filename]);
    if(prev.rows[0]) {
      if(prev.rows[0].checksum.trim()!==checksum) throw new Error(`Migration ${filename} was modified after it ran`);
      console.info(`Already applied ${filename}`);continue;
    }
    // Existing SQL bundles use outer BEGIN/COMMIT. The runner owns the transaction instead,
    // so schema changes and the migration receipt commit atomically.
    const sql=raw.replace(/^\s*BEGIN;\s*$/mi,'').replace(/^\s*COMMIT;\s*$/mi,'');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename,checksum) VALUES($1,$2)',[filename,checksum]);
      await client.query('COMMIT');
      console.info(`Applied ${filename}`);
    } catch(error) {await client.query('ROLLBACK');throw error;}
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(517342005)').catch(()=>{});
  client.release();await pool.end();
}
