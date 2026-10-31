import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const config = JSON.parse(await readFile(new URL('../wrangler.json', import.meta.url), 'utf8'));
const ownerAccountId = '17ced8b33ac43682371a9755c8c38887';
const databaseId = config.d1_databases?.find(binding => binding.binding === 'DB')?.database_id;
if (config.name !== 'frugal-v2' || (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_ACCOUNT_ID !== ownerAccountId) ||
    !/^[a-f0-9-]{36}$/.test(databaseId ?? '') || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(databaseId)) {
  throw new Error('Use the verified frugal-v2 account and real D1 binding before production deployment. A local placeholder cannot be deployed.');
}
const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'pages', 'deploy', 'dist', '--project-name', 'frugal-v2', '--branch', 'main'], { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ownerAccountId } });
process.exit(result.status ?? 1);
