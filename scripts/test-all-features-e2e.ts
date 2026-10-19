/** Legacy entrypoint: destructive live E2E checks have been retired. */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const tests = [
  'admin-list', 'booking-view', 'auth', 'booking-integrity', 'catalog',
  'media', 'settings', 'scheduling', 'status', 'tracking', 'calendar-dates', 'operations',
].map(name => resolve(root, 'tests', `${name}.test.ts`));
for (const file of tests) {
  if (!existsSync(file)) throw new Error(`Required regression test is missing: ${file}`);
}
console.log('Legacy live database mutations are retired. Running isolated mocked regression tests.');
// Even an accidentally unmocked query cannot reach the configured application database.
const isolatedUrl = 'postgresql://isolated_test:isolated_test@127.0.0.1:1/snapbook_tests?connect_timeout=1';
execFileSync(process.execPath, ['--import', 'tsx', '--test', ...tests], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: isolatedUrl, DIRECT_URL: isolatedUrl },
});
