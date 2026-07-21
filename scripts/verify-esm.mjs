/**
 * Sanity check for the ESM build.
 * Imports the compiled dist/esm output with a native `import` statement (as
 * any ESM-based JS or TS project would) and exercises a couple of exports
 * to confirm the build is wired up correctly. Mirrors verify-cjs.cjs so
 * both module systems get the same coverage.
 */

import assert from 'node:assert/strict';
import { isRequired, isObjectOf, isOptional } from '../dist/esm/index.js';

assert.equal(typeof isRequired, 'function', 'isRequired should be exported from the ESM build');
assert.equal(typeof isObjectOf, 'function', 'isObjectOf should be exported from the ESM build');
assert.equal(typeof isOptional, 'function', 'isOptional should be exported from the ESM build');

const isString = isRequired((value) => typeof value === 'string');

assert.equal(isString('hello'), true, 'isRequired predicate should accept a valid value');
assert.throws(() => isString(undefined), /missing/, 'isRequired predicate should throw on a missing value');

console.log('  \u2713 import from \'jcvd\' works against dist/esm');
