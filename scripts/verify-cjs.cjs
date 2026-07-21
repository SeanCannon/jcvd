'use strict';

/**
 * Sanity check for the CommonJS build.
 * Loads the compiled dist/cjs output with require() (as any plain JS
 * project would) and exercises a couple of exports to confirm the build is
 * wired up correctly. This is intentionally separate from spec/test.js:
 * it's checking that the *build artifact* is consumable, not the library's
 * runtime behavior.
 */

const assert = require('node:assert/strict');
const jcvd = require('../dist/cjs/index.js');

assert.equal(typeof jcvd.isRequired, 'function', 'isRequired should be exported from the CJS build');
assert.equal(typeof jcvd.isObjectOf, 'function', 'isObjectOf should be exported from the CJS build');
assert.equal(typeof jcvd.isOptional, 'function', 'isOptional should be exported from the CJS build');

const isString = jcvd.isRequired((value) => typeof value === 'string');

assert.equal(isString('hello'), true, 'isRequired predicate should accept a valid value');
assert.throws(() => isString(undefined), /missing/, 'isRequired predicate should throw on a missing value');

console.log('  \u2713 require(\'jcvd\') works against dist/cjs');
