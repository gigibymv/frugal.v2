// Development-only schema generator; never imported by a Pages Function.
import { DatabaseSync } from 'node:sqlite';
import { getMigrations } from 'better-auth/db/migration';
import { build } from 'esbuild';
import { writeFile, unlink } from 'node:fs/promises';
const output = new URL('./.auth-schema-config.mjs', import.meta.url);
await build({ entryPoints: ['server/auth.ts'], outfile: output.pathname, bundle: true,
  platform: 'node', format: 'esm', packages: 'external' });
try {
  const { authOptions } = await import(output.href);
  const database = new DatabaseSync(':memory:');
  const options = authOptions({ DB: database, AUTH_SECRET: 'schema-generation-only-not-a-runtime-secret' });
  const migrations = await getMigrations(options);
  const sql = await migrations.compileMigrations();
  await writeFile(new URL('../migrations/0001_auth.sql', import.meta.url),
    '-- Generated from better-auth 1.7.14 authOptions by node server/generate-auth-schema.mjs\n' + sql + '\n');
  database.close();
} finally {
  await unlink(output);
}
