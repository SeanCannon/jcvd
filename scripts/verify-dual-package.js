'use strict';

/**
 * End-to-end check that the published package actually works as both
 * CommonJS (require) and an ES module (import).
 *
 * Steps:
 *   1. Build dist/cjs and dist/esm from src/index.ts
 *   2. require() the CJS build in a throwaway script
 *   3. import the ESM build in a throwaway script
 *   4. Delete dist/ afterwards -- it's build output produced only to
 *      exercise this check, not something we want to leave lying around
 *      or commit.
 *
 * Run directly with `node scripts/verify-dual-package.js`, or via
 * `npm run test:dual-package`.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
}

function main() {
  console.log('> Building dist/cjs and dist/esm...');
  run('npm', ['run', '--silent', 'build']);

  console.log('> Verifying require(\'jcvd\') against dist/cjs...');
  run('node', ['scripts/verify-cjs.cjs']);

  console.log('> Verifying import from \'jcvd\' against dist/esm...');
  run('node', ['scripts/verify-esm.mjs']);

  console.log('> Cleaning up dist/ (build output was only needed for this check)...');
  cleanDist();

  console.log('\u2713 Dual-package (CJS + ESM) build verified successfully.');
}

try {
  main();
} catch (err) {
  console.error('\u2717 Dual-package verification failed.');
  cleanDist();
  process.exitCode = 1;
  throw err;
}
