// Runs every probe suite in order and fails if any check fails. Needs the app running (npm run dev) against the
// same throwaway database. See README.md.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('./guard.cjs').probeDatabaseUrl(); // fail fast before anything starts

const suites = fs.readdirSync(__dirname).filter((f) => /^\d\d-.*\.cjs$/.test(f)).sort();
let failed = 0;
for (const f of suites) {
  console.log(`\n=== ${f}`);
  const r = spawnSync('node', [path.join(__dirname, f)], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) failed++;
}
console.log(failed ? `\n${failed} suite(s) failed` : '\nAll suites passed');
process.exit(failed ? 1 : 0);
