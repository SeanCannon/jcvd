'use strict';

/**
 * tsc compiles src/index.ts into dist/cjs and dist/esm as plain .js files.
 * Node decides how to parse a .js file (CommonJS vs ES module) based on the
 * nearest package.json "type" field, so we drop a minimal package.json into
 * each output folder to disambiguate them without needing to rename files
 * to .cjs / .mjs.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const targets = [
  { dir: path.join(root, 'dist', 'cjs'), type: 'commonjs' },
  { dir: path.join(root, 'dist', 'esm'), type: 'module' },
];

for (const { dir, type } of targets) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Expected build output at ${dir} but it does not exist. Run the build step first.`);
  }

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ type }, null, 2) + '\n',
  );
}
