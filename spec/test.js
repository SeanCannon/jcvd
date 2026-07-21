'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  isPartialObjectOf,
  isObjectOf,
  isArrayOf,
  isOptional,
  isRequired,
  label,
  customErrors,
} = require('../dist/cjs/index.js');

const isString = isRequired(n => typeof n === 'string');
const isNumber = isRequired(n => typeof n === 'number');

const isAddress = isPartialObjectOf({
  street: isString,
  houseNumber: isNumber,
});

const isMyType = isPartialObjectOf({
  foo: isOptional(isString),
  bar: isNumber,
  arr: isArrayOf(isNumber),
  addresses: isOptional(isArrayOf(isAddress)),
});

const isMyOtherType = isPartialObjectOf({
  baz: isString,
  myType: isMyType,
});

const isMyErrorType = isPartialObjectOf({
  message: isString,
  code: isNumber,
});

describe('happy path', () => {
  it('validates nested object without throwing', () => {
    assert.doesNotThrow(() => {
      isMyOtherType({
        baz: 'dop',
        myType: {
          foo: '3',
          bar: 3,
          arr: [3, 3],
        },
      });
    });
  });
});

describe('missing array', () => {
  it('throws with path for missing required array', () => {
    assert.throws(() => {
      isMyOtherType({
        baz: 'dop',
        myType: {
          foo: '3',
          bar: 3,
        },
      });
    }, /myType -> arr -> missing/);
  });
});

describe('wrong type', () => {
  it('throws with path for invalid property type', () => {
    assert.throws(() => {
      isMyOtherType({
        baz: 'dop',
        myType: {
          foo: 3,
          bar: 3,
          arr: [3, 3],
        },
      });
    }, /myType -> foo -> invalid/);
  });
});

describe('missing optional', () => {
  it('allows omitted optional fields', () => {
    assert.doesNotThrow(() => {
      isMyOtherType({
        baz: 'dop',
        myType: {
          bar: 3,
          arr: [3, 3],
        },
      });
    });
  });
});

describe('array of objects', () => {
  it('validates nested array of objects', () => {
    assert.doesNotThrow(() => {
      isMyOtherType({
        baz: 'dop',
        myType: {
          bar: 3,
          arr: [3, 3],
          addresses: [
            {
              street: 'penny lane',
              houseNumber: 13,
            },
          ],
        },
      });
    });
  });
});

describe('array of objects with wrong property', () => {
  it('throws with full path for nested error', () => {
    assert.throws(() => {
      isMyOtherType({
        baz: 'dop',
        myType: {
          bar: 3,
          arr: [3, 3],
          addresses: [
            {
              street: 'penny lane',
              houseNumber: '13',
            },
          ],
        },
      });
    }, /myType -> addresses -> \[0\] -> houseNumber -> invalid/);
  });
});

describe('custom errors', () => {
  it('uses custom error messages', () => {
    const {
      isObjectOf: _isObjectOf,
      isArrayOf: _isArrayOf,
      isRequired: _isRequired,
    } = customErrors({
      handleInvalid: () => new Error('dang'),
      handleMissing: () => new Error('crap'),
    });

    const _isString = _isRequired(n => typeof n === 'string');

    const isAwesomeCar = _isObjectOf({
      whales: _isArrayOf(_isString),
      frond: _isString,
    });

    assert.throws(() => {
      isAwesomeCar({
        whales: ['beluga', 3],
      });
    }, /whales -> \[1\] -> dang/);

    assert.throws(() => {
      isAwesomeCar({
        frond: 'gop',
      });
    }, /whales -> crap/);
  });
});

describe('throw on bad custom errors', () => {
  it('throws when custom error handlers are missing functions', () => {
    assert.throws(() => {
      customErrors({
        handleInvalid: 'crunk',
      });
    }, /handleInvalid -> missing/);
  });
});

describe('throw on non-function predicate', () => {
  it('throws for isRequired with non-function', () => {
    assert.throws(() => {
      isRequired(false);
    }, /predicate is not a function/);
  });

  it('throws for isOptional with non-function', () => {
    assert.throws(() => {
      isOptional('foo');
    }, /predicate is not a function/);
  });

  it('throws for isArrayOf with non-function', () => {
    assert.throws(() => {
      isArrayOf('foo');
    }, /predicate is not a function/);
  });

  it('throws for isPartialObjectOf with non-function predicate', () => {
    assert.throws(() => {
      isPartialObjectOf({ bar: 'foo' });
    }, /predicate for bar is not a function/);
  });
});

describe('throw on non-array or non-object', () => {
  it('throws for object validator on array', () => {
    assert.throws(() => {
      isPartialObjectOf({ foo: isString })([]);
    }, /invalid/);
  });

  it('throws for array validator on object', () => {
    assert.throws(() => {
      isArrayOf(isString)({});
    }, /invalid/);
  });
});

describe('label', () => {
  it('prepends label to error path', () => {
    assert.throws(() => {
      label('myOtherType', isMyOtherType)({
        baz: 'dop',
        myType: {
          foo: '3',
          bar: 3,
        },
      });
    }, /myOtherType -> myType -> arr -> missing/);
  });

  it('returns the validated value on success', () => {
    const value = {
      baz: 'dop',
      myType: {
        foo: '3',
        bar: 3,
        arr: [3, 3],
      },
    };
    assert.equal(label('myOtherType', isMyOtherType)(value), value);
  });
});

describe('isObjectOf returns value', () => {
  it('returns the validated object instead of true', () => {
    const value = { name: 'test', count: 42 };
    const isThing = isObjectOf({ name: isString, count: isNumber });
    const result = isThing(value);
    assert.equal(result, value);
  });

  it('works as a type guard in if statements', () => {
    const value = { name: 'test', count: 42 };
    const isThing = isObjectOf({ name: isString, count: isNumber });
    if (isThing(value)) {
      assert.equal(value.name, 'test');
      assert.equal(value.count, 42);
    }
  });
});

describe('isObjectOf strict mode', () => {
  it('allows unknown properties in non-strict mode', () => {
    assert.doesNotThrow(() => {
      isPartialObjectOf({ foo: isString })({ foo: 'bar', extra: true });
    });
  });
});

describe('Error object validation', () => {
  it('validates error objects', () => {
    assert.doesNotThrow(() => {
      const error = new Error('Test error');
      error.code = 9001;
      isMyErrorType(error);
    });
  });

  it('throws on invalid error objects', () => {
    assert.throws(() => {
      const error = new Error('Test error');
      isMyErrorType(error);
    });
  });
});

describe('array edge cases', () => {
  it('throws on undefined input', () => {
    assert.throws(() => {
      isArrayOf(isString)(undefined);
    }, /missing/);
  });

  it('validates empty array', () => {
    assert.doesNotThrow(() => {
      isArrayOf(isString)([]);
    });
  });
});

describe('validateErrorHandlers branches', () => {
  it('throws when handleMissing is not a function', () => {
    assert.throws(() => {
      customErrors({ handleInvalid: () => new Error('x'), handleMissing: 'nope' });
    }, /handleMissing -> missing/);
  });

  it('throws when handleUnsupported is not a function', () => {
    assert.throws(() => {
      customErrors({
        handleInvalid: () => new Error('x'),
        handleMissing: () => new Error('x'),
        handleUnsupported: 'nope',
      });
    }, /handleUnsupported -> missing/);
  });
});

describe('object validator undefined input', () => {
  it('throws when value is undefined', () => {
    assert.throws(() => {
      isObjectOf({})(undefined);
    }, /missing/);
  });
});

describe('isObjectOf strict mode rejects unknown keys', () => {
  it('throws with unsupported path for extra property', () => {
    assert.throws(() => {
      isObjectOf({ foo: isString })({ foo: 'bar', extra: true });
    }, /extra -> unsupported/);
  });
});

describe('label non-function predicate', () => {
  it('throws when predicate is not a function', () => {
    assert.throws(() => {
      label('test', 'not-a-function');
    }, /predicate is not a function/);
  });
});

describe('label predicate returns false', () => {
  it('throws invalid when predicate returns false instead of throwing', () => {
    const isAlwaysFalse = isRequired(() => false);
    assert.throws(() => {
      label('test', isAlwaysFalse)('anything');
    }, /test -> invalid/);
  });
});
