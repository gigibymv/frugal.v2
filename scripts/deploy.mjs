import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const config = JSON.parse(await readFile(new URL('../wrangler.json', import.meta.url), 'utf8'));
const databaseId = config.d1_databases?.find(binding => binding.binding === 'DB')?.database_id;
if (config.name !== 'frugal-v2' || !config.account_id || !/^[a-f0-9]{32}$/.test(config.account_id) ||
    !/^[a-f0-9-]{36}$/.test(databaseId ?? '') || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(databaseId)) {
  throw new Error('Configure the verified frugal-v2 owning account_id and real D1 database_id before production deployment. The local placeholder cannot be deployed.');
}
const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'pages', 'deploy', 'dist', '--project-name', 'frugal-v2', '--branch', 'main'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
